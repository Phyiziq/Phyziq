import { prisma } from '../lib/db.js';
import { getHealthPool } from './health-db.js';
import { insertComplianceEvent } from '../lib/audit.js';

export async function runOdpcMonitoringAlert() {
  const healthPool = getHealthPool();
  
  // Count active members with health data consent in main DB
  const consentedMembersCount = await prisma.consentRecord.count({
    where: {
      consentType: 'health_data',
      granted: true,
      revokedAt: null
    }
  });

  // Count distinct members with health data in isolated DB
  const healthDbResult = await healthPool.query(
    'SELECT COUNT(DISTINCT member_id) as count FROM ncd_profiles'
  );
  
  const healthDataCount = parseInt(healthDbResult.rows[0].count || '0', 10);

  // If there are more health profiles than consented members, we have a violation
  if (healthDataCount > consentedMembersCount) {
    const violationDiff = healthDataCount - consentedMembersCount;
    
    // Log as data_breach / compliance_violation
    await insertComplianceEvent({
      memberId: null, // Platform-wide event
      eventType: 'data_breach',
      eventData: {
        description: 'ODPC Monitoring Alert: Health data count exceeds consented members',
        consentedMembersCount,
        healthDataCount,
        violationDiff
      }
    });
    
    console.error(`[ODPC ALERT] Critical privacy violation detected: ${violationDiff} orphaned health profiles found.`);
  } else {
    console.log(`[ODPC ALERT] Monitoring passed. Consented members: ${consentedMembersCount}, Health profiles: ${healthDataCount}`);
  }
}
