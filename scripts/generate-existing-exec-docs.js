/**
 * Generate all HR documents for existing C-level executives
 * Run with: node scripts/generate-existing-exec-docs.js
 * 
 * Requires: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */

import('dotenv').then(dotenv => dotenv.default.config());

const { createClient } = await import('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Finding C-level employees...\n');

// Get all C-level employees
const { data: employees, error } = await supabase
  .from('employees')
  .select(`
    id,
    first_name,
    last_name,
    email,
    position,
    hire_date,
    work_location,
    salary,
    employee_equity(shares_percentage, equity_type)
  `)
  .or('position.ilike.%chief%,position.ilike.%CEO%,position.ilike.%CFO%,position.ilike.%CTO%,position.ilike.%COO%,position.ilike.%CXO%,position.ilike.%President%');

if (error) {
  console.error('❌ Error fetching employees:', error);
  process.exit(1);
}

if (!employees || employees.length === 0) {
  console.log('❌ No C-level employees found.');
  console.log('💡 Create executives first using CEO Portal → Personnel Manager');
  process.exit(0);
}

console.log(`✅ Found ${employees.length} C-level employee(s):\n`);
employees.forEach(emp => {
  console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.position})`);
});

console.log('\n📄 Generating documents for each executive...\n');

for (const emp of employees) {
  const equity = emp.employee_equity?.[0];
  const isCLevel = /chief|ceo|cfo|cto|coo/i.test(emp.position);
  const isCEO = /ceo/i.test(emp.position);
  const stateCode = (emp.work_location || '').match(/\b(OH|MI|FL|GA|NY|MO|KS|LA)\b/i)?.[1]?.toUpperCase() || 'OH';

  console.log(`\n🎯 Processing ${emp.first_name} ${emp.last_name} (${emp.position})...`);

  const documentsToGenerate = [];

  // Board Resolution
  if (isCLevel) {
    documentsToGenerate.push({
      type: 'board_resolution',
      metadata: {
        employeeName: `${emp.first_name} ${emp.last_name}`,
        employeeEmail: emp.email,
        position: emp.position,
        resolutionNumber: `BR${new Date(emp.hire_date).getFullYear()}${Math.floor(Math.random() * 9000) + 1000}`,
        effectiveDate: emp.hire_date,
        companyName: 'Craven Inc',
        state: 'Ohio',
        boardMembers: [
          { name: 'Torrence Stroman', title: 'CEO', vote: 'for' },
          { name: 'Board Member 1', title: 'Independent Director', vote: 'for' }
        ],
        equityPercentage: equity?.shares_percentage,
        createdBy: null
      }
    });
  }

  // Offer Letter
  documentsToGenerate.push({
    type: 'offer_letter',
    metadata: {
      employeeName: `${emp.first_name} ${emp.last_name}`,
      employeeEmail: emp.email,
      position: emp.position,
      department: 'Executive',
      salary: emp.salary,
      startDate: emp.hire_date,
      companyName: 'Craven Inc',
      state: 'Ohio',
      createdBy: null
    }
  });

  // Equity Agreement
  if (isCLevel && equity && equity.shares_percentage > 0) {
    documentsToGenerate.push({
      type: 'equity_agreement',
      metadata: {
        employeeName: `${emp.first_name} ${emp.last_name}`,
        employeeEmail: emp.email,
        position: emp.position,
        equityPercentage: equity.shares_percentage,
        equityType: equity.equity_type || 'common_stock',
        companyName: 'Craven Inc',
        state: 'Ohio',
        createdBy: null
      }
    });
  }

  // Founders Agreement (CEO only)
  if (isCEO) {
    documentsToGenerate.push({
      type: 'founders_equity_insurance_agreement',
      metadata: {
        employeeName: `${emp.first_name} ${emp.last_name}`,
        employeeEmail: emp.email,
        position: emp.position,
        equityPercentage: equity?.shares_percentage || 0,
        companyName: 'Craven Inc',
        state: 'Ohio',
        resolutionNumber: `BR${new Date(emp.hire_date).getFullYear()}${Math.floor(Math.random() * 9000) + 1000}`,
        createdBy: null
      }
    });
  }

  // Government forms
  documentsToGenerate.push(
    {
      type: 'w4',
      metadata: {
        employeeName: `${emp.first_name} ${emp.last_name}`,
        address: emp.work_location || 'Address TBD',
        cityStateZip: emp.work_location || 'City, ST ZIP',
        ssnLast4: null
      }
    },
    {
      type: 'i9',
      metadata: {
        firstName: emp.first_name,
        lastName: emp.last_name
      }
    }
  );

  // State-specific form
  const stateForms = {
    'OH': 'oh_it4',
    'MI': 'mi_w4',
    'GA': 'ga_g4',
    'NY': 'ny_it2104',
    'KS': 'ks_k4'
  };

  if (stateForms[stateCode]) {
    documentsToGenerate.push({
      type: stateForms[stateCode],
      metadata: {
        employeeName: `${emp.first_name} ${emp.last_name}`,
        ssnLast4: null
      }
    });
  }

  // Company forms
  documentsToGenerate.push(
    { type: 'direct_deposit', metadata: { employeeName: `${emp.first_name} ${emp.last_name}` } },
    { type: 'emergency_contact', metadata: { employeeName: `${emp.first_name} ${emp.last_name}` } },
    { type: 'conf_ip', metadata: { employeeName: `${emp.first_name} ${emp.last_name}`, position: emp.position } },
    { type: 'arbitration', metadata: { employeeName: `${emp.first_name} ${emp.last_name}` } }
  );

  console.log(`  📝 Generating ${documentsToGenerate.length} documents...`);

  let successCount = 0;
  let failCount = 0;

  for (const doc of documentsToGenerate) {
    try {
      const { error: genError } = await supabase.functions.invoke('generate-hr-pdf', {
        body: {
          documentType: doc.type,
          employeeId: emp.id,
          metadata: doc.metadata,
          alsoEmail: false
        }
      });

      if (genError) {
        console.error(`    ❌ Failed ${doc.type}:`, genError.message);
        failCount++;
      } else {
        console.log(`    ✅ ${doc.type}`);
        successCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`    ❌ Error ${doc.type}:`, err.message);
      failCount++;
    }
  }

  console.log(`  ✅ ${emp.first_name}: ${successCount} success, ${failCount} failed`);
}

console.log('\n✨ Document generation complete!');
console.log('💡 Check Board Portal → Document Vault to see all documents');
process.exit(0);

