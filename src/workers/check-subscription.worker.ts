import { UserRepository } from '../repositories/user.repository';
import { CronJob } from 'cron';

export const checkSubscriptionJob = new CronJob('0 1 * * *', checkSubscriptionWorker);

const userRepository = new UserRepository();

export async function checkSubscriptionWorker(): Promise<void> {
  const users = await userRepository.getUsersWithExpiredSubscription();

  for (const user of users) {
    await userRepository.updateUser(user, { subscriptionExpiresAt: null });
  }
}
