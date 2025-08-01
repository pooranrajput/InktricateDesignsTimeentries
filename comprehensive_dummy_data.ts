// Comprehensive dummy data creation for all employees and months
import { db } from './server/db';
import { users, timeEntries, taskCategories, monthlyPayroll } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function createComprehensiveDummyData() {
  console.log('🚀 CREATING COMPREHENSIVE DUMMY DATA');
  console.log('===================================');
  
  try {
    // Get all active employees
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));
    
    console.log(`✅ Found ${allUsers.length} active employees`);
    allUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - $${user.hourlyRate}/hr`);
    });
    
    // Get all task categories for variety
    const categories = await db.select().from(taskCategories);
    console.log(`✅ Found ${categories.length} task categories`);
    
    const months = [
      { month: 7, name: 'July' },
      { month: 8, name: 'August' },
      { month: 9, name: 'September' },
      { month: 10, name: 'October' },
      { month: 11, name: 'November' },
      { month: 12, name: 'December' }
    ];
    
    console.log('\n📅 Creating timesheet entries for 6 months...');
    
    let totalEntriesCreated = 0;
    
    for (const user of allUsers) {
      console.log(`\n👤 Creating entries for ${user.firstName} ${user.lastName}:`);
      
      for (const monthInfo of months) {
        console.log(`  📅 ${monthInfo.name} 2025:`);
        
        // Create 15-25 random entries per month per employee
        const entriesThisMonth = 15 + Math.floor(Math.random() * 11); // 15-25 entries
        let monthlyHours = 0;
        
        for (let i = 0; i < entriesThisMonth; i++) {
          // Random date within the month
          const day = 1 + Math.floor(Math.random() * 28); // 1-28 to avoid month-end issues
          const date = new Date(2025, monthInfo.month - 1, day);
          
          // Random hours between 1-8 hours per entry
          const hours = 1 + Math.random() * 7; // 1-8 hours
          monthlyHours += hours;
          
          // Random task category
          const category = categories[Math.floor(Math.random() * categories.length)];
          
          // Create realistic task descriptions
          const taskDescriptions = [
            'Wedding consultation and planning',
            'Venue decoration setup',
            'Floral arrangement design',
            'Client meeting and coordination',
            'Event execution and management',
            'Post-event cleanup and breakdown',
            'Vendor coordination and logistics',
            'Design development and revisions',
            'Site visit and assessment',
            'Material sourcing and procurement',
            'Quality control and inspection',
            'Team coordination and briefing',
            'Client presentation preparation',
            'Photography coordination',
            'Timeline planning and scheduling'
          ];
          
          const description = taskDescriptions[Math.floor(Math.random() * taskDescriptions.length)];
          
          // Create realistic start and end times in HH:MM:SS format
          const startHour = 8 + Math.floor(Math.random() * 4); // 8am-12pm start
          const startMinute = Math.floor(Math.random() * 60);
          const endHour = startHour + Math.floor(hours);
          const endMinute = startMinute + Math.floor((hours % 1) * 60);
          
          // Adjust for minute overflow
          const adjustedEndHour = endHour + Math.floor(endMinute / 60);
          const adjustedEndMinute = endMinute % 60;
          
          const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
          const endTimeStr = `${adjustedEndHour.toString().padStart(2, '0')}:${adjustedEndMinute.toString().padStart(2, '0')}:00`;
          
          // Create realistic project names
          const projectNames = [
            'Wedding Project Alpha',
            'Corporate Event Setup',
            'Birthday Celebration',
            'Anniversary Party',
            'Garden Wedding',
            'Venue Decoration',
            'Floral Arrangement',
            'Event Coordination'
          ];
          
          const project = projectNames[Math.floor(Math.random() * projectNames.length)];
          
          await db.insert(timeEntries).values({
            userId: user.id,
            date: date,
            startTime: startTimeStr,
            endTime: endTimeStr,
            project: project,
            clientName: `Client ${Math.floor(Math.random() * 100) + 1}`,
            taskCategoryId: category.id,
            notes: description,
            totalHours: hours.toFixed(2),
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          totalEntriesCreated++;
        }
        
        console.log(`    ✅ Created ${entriesThisMonth} entries, ${monthlyHours.toFixed(1)} total hours`);
      }
    }
    
    console.log(`\n🎉 DUMMY DATA CREATION COMPLETE!`);
    console.log(`📊 Total entries created: ${totalEntriesCreated}`);
    console.log(`👥 Employees: ${allUsers.length}`);
    console.log(`📅 Months: ${months.length}`);
    console.log(`💼 Average entries per employee per month: ${(totalEntriesCreated / (allUsers.length * months.length)).toFixed(1)}`);
    
    return { totalEntriesCreated, employeeCount: allUsers.length, monthCount: months.length };
    
  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
    throw error;
  }
}

// Run the function
createComprehensiveDummyData();