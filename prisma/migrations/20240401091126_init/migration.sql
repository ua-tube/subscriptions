-- CreateTable
CREATE TABLE "creators" (
    "id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "subscribers_count" BIGINT NOT NULL,
    "subscriptions_count" INTEGER NOT NULL,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "creator_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("creator_id","target_id")
);

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
