/**
 * Generate all HR documents for existing C-level executives
 * Run this script after deploying the HR system to retroactively create documents
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  hire_date: string;
  work_location: string | null;
  salary: number | null;
}

interface EquityData {
  shares_percentage: number | null;
  equity_type: string | null;
}

async function generateDocumentsForExistingExecs() {
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
    console.error('Error fetching employees:', error);
    return;
  }

  if (!employees || employees.length === 0) {
    console.log('❌ No C-level employees found.');
    console.log('💡 Create executives first using CEO Portal → Personnel Manager');
    return;
  }

  console.log(`✅ Found ${employees.length} C-level employee(s):\n`);
  employees.forEach(emp => {
    console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.position})`);
  });

  console.log('\n📄 Generating documents for each executive...\n');

  for (const emp of employees) {
    const equity = (emp.employee_equity as any)?.[0] as EquityData | undefined;
    const isCLevel = /chief|ceo|cfo|cto|coo/i.test(emp.position);
    const isCEO = /ceo/i.test(emp.position);
    const stateCode = (emp.work_location || '').match(/\b(OH|MI|FL|GA|NY|MO|KS|LA)\b/i)?.[1]?.toUpperCase() || 'OH';

    console.log(`\n🎯 Processing ${emp.first_name} ${emp.last_name} (${emp.position})...`);

    // Determine which documents to generate
    const documentsToGenerate: Array<{ type: string; metadata: any }> = [];

    // Board Resolution (all C-level)
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
            { name: 'Torrance Stroman', title: 'CEO', vote: 'for' },
            { name: 'Board Member 1', title: 'Independent Director', vote: 'for' },
            { name: 'Board Member 2', title: 'Independent Director', vote: 'for' }
          ],
          equityPercentage: equity?.shares_percentage,
          createdBy: null
        }
      });
    }

    // Offer Letter (all employees)
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

    // Equity Agreement (C-level with equity)
    if (isCLevel && equity && equity.shares_percentage && equity.shares_percentage > 0) {
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

    // Government forms (all employees)
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
    if (stateCode === 'OH') {
      documentsToGenerate.push({
        type: 'oh_it4',
        metadata: {
          employeeName: `${emp.first_name} ${emp.last_name}`,
          ssnLast4: null
        }
      });
    } else if (stateCode === 'MI') {
      documentsToGenerate.push({
        type: 'mi_w4',
        metadata: {
          employeeName: `${emp.first_name} ${emp.last_name}`,
          ssnLast4: null
        }
      });
    } else if (stateCode === 'GA') {
      documentsToGenerate.push({
        type: 'ga_g4',
        metadata: {
          employeeName: `${emp.first_name} ${emp.last_name}`,
          ssnLast4: null
        }
      });
    } else if (stateCode === 'NY') {
      documentsToGenerate.push({
        type: 'ny_it2104',
        metadata: {
          employeeName: `${emp.first_name} ${emp.last_name}`,
          ssnLast4: null
        }
      });
    } else if (stateCode === 'KS') {
      documentsToGenerate.push({
        type: 'ks_k4',
        metadata: {
          employeeName: `${emp.first_name} ${emp.last_name}`,
          ssnLast4: null
        }
      });
    }

    // Company forms
    documentsToGenerate.push(
      {
        type: 'direct_deposit',
        metadata: {
          employeeName: `${emp.first_name} ${emp.last_name}`
        }
      },
      {
        type: 'emergency_contact',
        metadata: {
          employeeName: `${emp.first_name} ${emp.last_name}`
        }
      },
      {
        type: 'conf_ip',
        metadata: {
          employeeName: `${emp.first_name} ${emp.last_name}`,
          position: emp.position
        }
      },
      {
        type: 'arbitration',
        metadata: {
          employeeName: `${emp.first_name} ${emp.last_name}`
        }
      }
    );

    console.log(`  📝 Generating ${documentsToGenerate.length} documents...`);

    // Generate each document
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
          console.error(`    ❌ Failed to generate ${doc.type}:`, genError.message);
          failCount++;
        } else {
          console.log(`    ✅ Generated ${doc.type}`);
          successCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err: any) {
        console.error(`    ❌ Error generating ${doc.type}:`, err.message);
        failCount++;
      }
    }

    console.log(`  ✅ Completed: ${successCount} successful, ${failCount} failed`);
  }

  console.log('\n✨ Document generation complete!');
  console.log('💡 Check Board Portal → Document Vault to see all documents');
}

// Run the script
generateDocumentsForExistingExecs()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

