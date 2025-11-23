import fs from 'fs';
import path from 'path';

function transformCSV() {
  try {
    console.log('🔄 Transforming Missouri CSV format...');
    
    const csvPath = path.join(process.cwd(), 'missouri_locations_with_header.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Processing ${lines.length} lines...`);
    
    const transformedLines = [];
    
    // Process header
    const header = lines[0];
    const newHeader = 'location_code,city,state,country,location_code_parent,country_iso_code,location_type';
    transformedLines.push(newHeader);
    
    // Process data lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by comma but handle quoted fields
      const fields = parseCSVLine(line);
      if (fields.length < 2) continue;
      
      const locationCode = fields[0];
      const locationName = fields[1];
      const locationCodeParent = fields[2] || '';
      const countryIsoCode = fields[3] || '';
      const locationType = fields[4] || '';
      
      // Split location name by comma
      const locationParts = locationName.split(',').map(part => part.trim().replace(/"/g, ''));
      
      let city = '';
      let state = '';
      let country = '';
      
      if (locationParts.length >= 3) {
        city = locationParts[0];
        state = locationParts[1];
        country = locationParts[2];
      } else if (locationParts.length === 2) {
        city = locationParts[0];
        state = locationParts[1];
        country = 'United States'; // Default
      } else {
        city = locationParts[0];
        state = 'Missouri'; // Default for Missouri CSV
        country = 'United States'; // Default
      }
      
      // Create new line
      const newLine = `${locationCode},"${city}","${state}","${country}",${locationCodeParent},${countryIsoCode},${locationType}`;
      transformedLines.push(newLine);
    }
    
    // Write transformed CSV
    const outputPath = path.join(process.cwd(), 'missouri_locations_transformed.csv');
    fs.writeFileSync(outputPath, transformedLines.join('\n'));
    
    console.log(`✅ Transformation complete!`);
    console.log(`📁 Output file: ${outputPath}`);
    console.log(`📊 Processed ${transformedLines.length - 1} data rows`);
    
    // Show sample of transformed data
    console.log('\n📋 Sample of transformed data:');
    for (let i = 0; i < Math.min(5, transformedLines.length); i++) {
      console.log(transformedLines[i]);
    }
    
  } catch (error) {
    console.error('❌ Error transforming CSV:', error);
  }
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
}

transformCSV();
