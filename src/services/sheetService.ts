import { Product } from '../types';

/**
 * Fetches product data from either a SheetBest API (JSON) or a direct Google Sheet (CSV).
 */
export async function fetchProductsFromSheet(url: string): Promise<Product[]> {
  try {
    let fetchUrl = url.trim();

    // Handle raw IDs instead of full URLs
    if (!fetchUrl.startsWith('http')) {
      if (fetchUrl.length > 30) {
        // Assume Google Sheet ID
        console.log('Detected raw Google Sheet ID, converting to export URL');
        fetchUrl = `https://docs.google.com/spreadsheets/d/${fetchUrl}/export?format=csv&gid=0`;
      } else if (fetchUrl.length > 5) {
        // Assume SheetBest ID
        console.log('Detected raw SheetBest ID, converting to API URL');
        fetchUrl = `https://api.sheetbest.com/sheets/${fetchUrl}`;
      }
    }

    // Automatically transform Google Sheets "edit" URL to "CSV export" URL
    if (fetchUrl.includes('docs.google.com/spreadsheets')) {
      const sheetIdMatch = fetchUrl.match(/\/d\/([^/]+)/);
      if (sheetIdMatch) {
        const sheetId = sheetIdMatch[1];
        const gidMatch = fetchUrl.match(/gid=([^#&]+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }
    }

    // Add cache busting to ensure fresh data
    const finalUrl = fetchUrl.includes('?') 
      ? `${fetchUrl}&nocache=${Date.now()}` 
      : `${fetchUrl}?nocache=${Date.now()}`;

    console.log('--- FETCH START ---');
    console.log('Final Fetch URL:', finalUrl);
    
    const response = await fetch(finalUrl);
    
    if (!response.ok) {
      console.error(`Fetch failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const rawText = await response.text();
    const text = rawText.trim();
    console.log('Response length:', text.length);
    
    if (text.toLowerCase().includes('<!doctype html') || text.toLowerCase().includes('<html')) {
      console.error('ERROR: Received HTML instead of data. This usually means the Google Sheet is NOT public.');
      console.log('Response preview (first 200 chars):', text.substring(0, 200));
      return [];
    }

    // Try JSON parsing
    try {
      if (text.startsWith('[') || text.startsWith('{')) {
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : [data];
        console.log('JSON items found:', items.length);

        const products = items.map((item: any, index: number) => {
          // Helper for fuzzy key matching - more robust
          const getValue = (keywords: string[]) => {
            // Try exact match first
            for (const kw of keywords) {
              if (item[kw] !== undefined && item[kw] !== null && item[kw] !== '') return item[kw];
            }
            // Try case-insensitive and partial match
            const key = Object.keys(item).find(k => 
              keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase()))
            );
            return key ? item[key] : undefined;
          };

          const name = getValue(['الاسم (Name)', 'الاسم', 'name', 'product']) || '';
          const priceRaw = getValue(['السعر (Price)', 'السعر', 'price', 'cost']) || 0;
          const image = getValue(['الصورة (Image)', 'الصورة', 'الصوره', 'image', 'img', 'photo']) || '';
          const category = getValue(['القسم (Category)', 'القسم', 'category', 'type']) || 'الكل';
          const description = getValue(['الوصف (Description)', 'الوصف', 'description']) || '';
          const ingredients = getValue(['المكونات', 'ingredients']) || '';
          const calories = getValue(['السعرات', 'calories']) || 0;
          const size = getValue(['الحجم', 'size']) || '';
          const options = getValue(['الخيارات', 'options']) || '';

          return {
            id: item.id || `prod-${index}-${Date.now()}`,
            name: String(name).trim(),
            price: parseFloat(String(priceRaw).replace(/[^0-9.]/g, '')) || 0,
            image: String(image).trim(),
            category: String(category).trim() || 'الكل',
            description: String(description).trim(),
            ingredients: String(ingredients).trim(),
            calories: parseInt(String(calories)) || 0,
            size: String(size).trim(),
            options: String(options).trim()
          };
        }).filter(p => p.name !== '' && p.price > 0);

        console.log('Valid products after JSON mapping:', products.length);
        if (products.length > 0) return products;
      }
    } catch (e) {
      console.log('JSON parsing failed or returned no valid products, falling back to CSV');
    }

    // CSV Parsing Fallback
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      console.warn('CSV too short or empty. Content was:', text.substring(0, 100));
      return [];
    }

    const parseCSVLine = (t: string) => {
      const result = [];
      let curValue = '';
      let inQuotes = false;
      for (let i = 0; i < t.length; i++) {
        const char = t[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(curValue.trim());
          curValue = '';
        } else curValue += char;
      }
      result.push(curValue.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      const clean = h.toLowerCase().replace(/"/g, '').trim();
      if (clean.includes('name') || clean.includes('الاسم')) headerMap.name = i;
      if (clean.includes('price') || clean.includes('السعر')) headerMap.price = i;
      if (clean.includes('image') || clean.includes('الصورة')) headerMap.image = i;
      if (clean.includes('category') || clean.includes('القسم')) headerMap.category = i;
      if (clean.includes('description') || clean.includes('الوصف')) headerMap.description = i;
    });

    const csvProducts: Product[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      const p: any = {
        id: `prod-csv-${i}`,
        name: headerMap.name !== undefined ? vals[headerMap.name] : '',
        price: headerMap.price !== undefined ? parseFloat(String(vals[headerMap.price]).replace(/[^0-9.]/g, '')) : 0,
        image: headerMap.image !== undefined ? vals[headerMap.image] : '',
        category: (headerMap.category !== undefined && vals[headerMap.category]) ? vals[headerMap.category] : 'الكل',
        description: headerMap.description !== undefined ? vals[headerMap.description] : ''
      };
      if (p.name && p.price > 0) csvProducts.push(p as Product);
    }

    console.log('CSV products found:', csvProducts.length);
    return csvProducts;
  } catch (error) {
    console.error('CRITICAL ERROR in fetchProductsFromSheet:', error);
    return [];
  }
}

// Fallback mock data if sheet is not available or fails
export const MOCK_PRODUCTS: Product[] = [
  { id: 'test-1', name: 'تجريب', price: 45, image: 'https://1toolz.sirv.com/Images/780/1.png', category: 'مخبوزات', description: 'تجريبي', ingredients: 'دقيق، سكر، زبدة', calories: 200, size: 'صغير', options: 'بدون سكر' },
  { id: '1', name: 'كرواسون زبدة', price: 45, image: 'https://picsum.photos/seed/croissant/400/400', category: 'مخبوزات', description: 'كرواسون طازج', ingredients: 'دقيق، زبدة، حليب', calories: 250, size: 'متوسط' },
  { id: '2', name: 'كيكة الشوكولاتة', price: 350, image: 'https://picsum.photos/seed/cake/400/400', category: 'حلويات', description: 'كيكة غنية بالشوكولاتة', ingredients: 'دقيق، كاكاو، بيض، سكر', calories: 400, size: 'كبير' },
  { id: '3', name: 'تشيز كيك لوتس', price: 120, image: 'https://picsum.photos/seed/lotus/400/400', category: 'سبيشيال لوتس', description: 'تشيز كيك بصوص اللوتس', ingredients: 'جبن كريمي، بسكويت لوتس، زبدة', calories: 350, size: 'قطعة' },
  { id: '4', name: 'آيس لاتيه', price: 65, image: 'https://picsum.photos/seed/latte/400/400', category: 'مشروبات', description: 'قهوة باردة', ingredients: 'قهوة، حليب، ثلج', calories: 100, size: 'كبير' },
  { id: '5', name: 'باجيت فرنسي', price: 30, image: 'https://picsum.photos/seed/baguette/400/400', category: 'مخبوزات', description: 'باجيت طازج', ingredients: 'دقيق، خميرة، ملح', calories: 150, size: 'طويل' },
  { id: '6', name: 'ماكرون (6 قطع)', price: 180, image: 'https://picsum.photos/seed/macarons/400/400', category: 'الأكثر مبيعاً', description: 'ماكرون فرنسي', ingredients: 'دقيق لوز، سكر، بيض', calories: 120, size: '6 قطع' },
  { id: '7', name: 'دونات لوتس', price: 55, image: 'https://picsum.photos/seed/donut/400/400', category: 'سبيشيال لوتس', description: 'دونات بصوص اللوتس', ingredients: 'دقيق، سكر، بسكويت لوتس', calories: 300, size: 'قطعة' },
  { id: '8', name: 'عصير برتقال فريش', price: 50, image: 'https://picsum.photos/seed/orange/400/400', category: 'مشروبات', description: 'عصير برتقال طازج', ingredients: 'برتقال', calories: 80, size: 'كبير' },
];
