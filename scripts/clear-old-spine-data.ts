/**
 * Clear old incomplete Spine data from database
 */
import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

async function clearOldData() {
  console.log("🗑️  Clearing old incomplete Spine data...");
  
  try {
    // Find all Spine jobs
    const jobs = await prisma.serpJob.findMany({
      where: { keyword: "Spine" },
      select: { id: true, location: true, status: true }
    });
    
    console.log(`   Found ${jobs.length} Spine job(s)`);
    
    for (const job of jobs) {
      console.log(`   Deleting job: ${job.id} (${job.location}, ${job.status})`);
      
      // Delete keyword rankings first (foreign key constraint)
      await prisma.keywordRanking.deleteMany({
        where: {
          businessProfile: {
            serpResult: {
              serpJobId: job.id
            }
          }
        }
      });
      
      // Delete business profiles
      await prisma.businessProfile.deleteMany({
        where: {
          serpResult: {
            serpJobId: job.id
          }
        }
      });
      
      // Delete serp results
      await prisma.serpResult.deleteMany({
        where: {
          serpJobId: job.id
        }
      });
      
      // Delete the job
      await prisma.serpJob.delete({
        where: { id: job.id }
      });
    }
    
    console.log("✅ Old data cleared successfully");
  } catch (error: any) {
    console.error("❌ Error clearing old data:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearOldData();

