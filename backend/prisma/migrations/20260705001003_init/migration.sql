-- CreateEnum
CREATE TYPE "TimeOfDay" AS ENUM ('morning', 'afternoon', 'evening');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "note" TEXT,
    "timeOfDay" "TimeOfDay" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeOfDay" "TimeOfDay" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MoodEntryCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MoodEntryCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "MoodEntry_userId_date_idx" ON "MoodEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderSetting_userId_timeOfDay_key" ON "ReminderSetting"("userId", "timeOfDay");

-- CreateIndex
CREATE INDEX "_MoodEntryCategories_B_index" ON "_MoodEntryCategories"("B");

-- AddForeignKey
ALTER TABLE "MoodEntry" ADD CONSTRAINT "MoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderSetting" ADD CONSTRAINT "ReminderSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MoodEntryCategories" ADD CONSTRAINT "_MoodEntryCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MoodEntryCategories" ADD CONSTRAINT "_MoodEntryCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "MoodEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
