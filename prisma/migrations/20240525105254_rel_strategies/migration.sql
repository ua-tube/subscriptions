-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_target_id_fkey";

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
