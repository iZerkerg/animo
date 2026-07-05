-- CreateTable
CREATE TABLE "MoodEntryEmotion" (
    "id" TEXT NOT NULL,
    "moodEntryId" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "intensity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodEntryEmotion_pkey" PRIMARY KEY ("id")
);

-- Backfill existing one-emotion rows into the new relation without deleting legacy data.
INSERT INTO "MoodEntryEmotion" ("id", "moodEntryId", "emotion", "emoji", "createdAt")
SELECT
    CONCAT('legacy_', "id"),
    "id",
    "emotion",
    "emoji",
    COALESCE("createdAt", CURRENT_TIMESTAMP)
FROM "MoodEntry"
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE INDEX "MoodEntryEmotion_moodEntryId_idx" ON "MoodEntryEmotion"("moodEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "MoodEntryEmotion_moodEntryId_emotion_key" ON "MoodEntryEmotion"("moodEntryId", "emotion");

-- AddForeignKey
ALTER TABLE "MoodEntryEmotion" ADD CONSTRAINT "MoodEntryEmotion_moodEntryId_fkey" FOREIGN KEY ("moodEntryId") REFERENCES "MoodEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
