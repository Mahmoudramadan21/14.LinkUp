/*
  Warnings:

  - The primary key for the `Attachment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fileName` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `messageId` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AuditLog` table. All the data in the column will be lost.
  - The primary key for the `Conversation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Conversation` table. All the data in the column will be lost.
  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `content` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `conversationId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `replyToId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `Message` table. All the data in the column will be lost.
  - The primary key for the `Reaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `emoji` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `messageId` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `lastActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[LastMessageId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[MessageId,UserId]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.
  - The required column `Id` was added to the `Attachment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `MessageId` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Type` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Url` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - The required column `Id` was added to the `Conversation` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `UpdatedAt` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ConversationId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - The required column `Id` was added to the `Message` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `SenderId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UpdatedAt` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Emoji` to the `Reaction` table without a default value. This is not possible if the table is not empty.
  - The required column `Id` was added to the `Reaction` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `MessageId` to the `Reaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UserId` to the `Reaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE');

-- AlterEnum
ALTER TYPE "Gender" ADD VALUE 'OTHER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'STORY_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'SHARE';

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_messageId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_replyToId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_messageId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "_MessageReadBy" DROP CONSTRAINT "_MessageReadBy_A_fkey";

-- DropForeignKey
ALTER TABLE "_ParticipantConversations" DROP CONSTRAINT "_ParticipantConversations_A_fkey";

-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "Conversation_updatedAt_idx";

-- DropIndex
DROP INDEX "Reaction_messageId_userId_key";

-- AlterTable
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_pkey",
DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "id",
DROP COLUMN "messageId",
DROP COLUMN "type",
DROP COLUMN "url",
ADD COLUMN     "Duration" DOUBLE PRECISION,
ADD COLUMN     "FileName" TEXT,
ADD COLUMN     "FileSize" INTEGER,
ADD COLUMN     "Id" TEXT NOT NULL,
ADD COLUMN     "MessageId" TEXT NOT NULL,
ADD COLUMN     "Metadata" JSONB,
ADD COLUMN     "Thumbnail" TEXT,
ADD COLUMN     "Type" "AttachmentType" NOT NULL,
ADD COLUMN     "Url" TEXT NOT NULL,
ADD CONSTRAINT "Attachment_pkey" PRIMARY KEY ("Id");

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "createdAt",
ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "updatedAt",
ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "Id" TEXT NOT NULL,
ADD COLUMN     "LastMessageId" TEXT,
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY ("Id");

-- AlterTable
ALTER TABLE "Message" DROP CONSTRAINT "Message_pkey",
DROP COLUMN "content",
DROP COLUMN "conversationId",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "readAt",
DROP COLUMN "replyToId",
DROP COLUMN "senderId",
ADD COLUMN     "Content" TEXT,
ADD COLUMN     "ConversationId" TEXT NOT NULL,
ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "DeletedAt" TIMESTAMP(3),
ADD COLUMN     "Id" TEXT NOT NULL,
ADD COLUMN     "IsDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "IsEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "Metadata" JSONB,
ADD COLUMN     "ReadAt" TIMESTAMP(3),
ADD COLUMN     "ReplyToId" TEXT,
ADD COLUMN     "SenderId" INTEGER NOT NULL,
ADD COLUMN     "Status" "MessageStatus" NOT NULL DEFAULT 'SENT',
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("Id");

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "SharedPostID" INTEGER,
ALTER COLUMN "Content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_pkey",
DROP COLUMN "emoji",
DROP COLUMN "id",
DROP COLUMN "messageId",
DROP COLUMN "userId",
ADD COLUMN     "Emoji" TEXT NOT NULL,
ADD COLUMN     "Id" TEXT NOT NULL,
ADD COLUMN     "MessageId" TEXT NOT NULL,
ADD COLUMN     "UserId" INTEGER NOT NULL,
ADD CONSTRAINT "Reaction_pkey" PRIMARY KEY ("Id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastActive",
DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry",
ADD COLUMN     "LastActive" TIMESTAMP(3),
ADD COLUMN     "ResetToken" TEXT,
ADD COLUMN     "ResetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MessageEdit" (
    "Id" TEXT NOT NULL,
    "MessageId" TEXT NOT NULL,
    "OldContent" TEXT,
    "EditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EditorId" INTEGER NOT NULL,

    CONSTRAINT "MessageEdit_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "MessageDelete" (
    "Id" TEXT NOT NULL,
    "MessageId" TEXT NOT NULL,
    "DeletedBy" INTEGER NOT NULL,
    "DeletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageDelete_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "StoryReport" (
    "ReportID" SERIAL NOT NULL,
    "StoryID" INTEGER NOT NULL,
    "ReporterID" INTEGER NOT NULL,
    "Reason" TEXT NOT NULL,
    "Status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryReport_pkey" PRIMARY KEY ("ReportID")
);

-- CreateTable
CREATE TABLE "PostView" (
    "ViewID" SERIAL NOT NULL,
    "PostID" INTEGER NOT NULL,
    "UserID" INTEGER NOT NULL,
    "ViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostView_pkey" PRIMARY KEY ("ViewID")
);

-- CreateIndex
CREATE INDEX "MessageEdit_MessageId_idx" ON "MessageEdit"("MessageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageDelete_MessageId_key" ON "MessageDelete"("MessageId");

-- CreateIndex
CREATE INDEX "StoryReport_StoryID_idx" ON "StoryReport"("StoryID");

-- CreateIndex
CREATE INDEX "StoryReport_ReporterID_idx" ON "StoryReport"("ReporterID");

-- CreateIndex
CREATE INDEX "StoryReport_Status_idx" ON "StoryReport"("Status");

-- CreateIndex
CREATE INDEX "PostView_PostID_idx" ON "PostView"("PostID");

-- CreateIndex
CREATE INDEX "PostView_UserID_idx" ON "PostView"("UserID");

-- CreateIndex
CREATE INDEX "PostView_ViewedAt_idx" ON "PostView"("ViewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostView_PostID_UserID_key" ON "PostView"("PostID", "UserID");

-- CreateIndex
CREATE INDEX "Attachment_MessageId_idx" ON "Attachment"("MessageId");

-- CreateIndex
CREATE INDEX "AuditLog_CreatedAt_idx" ON "AuditLog"("CreatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_LastMessageId_key" ON "Conversation"("LastMessageId");

-- CreateIndex
CREATE INDEX "Conversation_UpdatedAt_idx" ON "Conversation"("UpdatedAt");

-- CreateIndex
CREATE INDEX "Message_ConversationId_CreatedAt_idx" ON "Message"("ConversationId", "CreatedAt");

-- CreateIndex
CREATE INDEX "Message_SenderId_idx" ON "Message"("SenderId");

-- CreateIndex
CREATE INDEX "Post_SharedPostID_idx" ON "Post"("SharedPostID");

-- CreateIndex
CREATE INDEX "Reaction_MessageId_idx" ON "Reaction"("MessageId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_MessageId_UserId_key" ON "Reaction"("MessageId", "UserId");

-- CreateIndex
CREATE INDEX "User_LastActive_idx" ON "User"("LastActive");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_LastMessageId_fkey" FOREIGN KEY ("LastMessageId") REFERENCES "Message"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_ConversationId_fkey" FOREIGN KEY ("ConversationId") REFERENCES "Conversation"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_SenderId_fkey" FOREIGN KEY ("SenderId") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_ReplyToId_fkey" FOREIGN KEY ("ReplyToId") REFERENCES "Message"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageEdit" ADD CONSTRAINT "MessageEdit_MessageId_fkey" FOREIGN KEY ("MessageId") REFERENCES "Message"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageEdit" ADD CONSTRAINT "MessageEdit_EditorId_fkey" FOREIGN KEY ("EditorId") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDelete" ADD CONSTRAINT "MessageDelete_MessageId_fkey" FOREIGN KEY ("MessageId") REFERENCES "Message"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDelete" ADD CONSTRAINT "MessageDelete_DeletedBy_fkey" FOREIGN KEY ("DeletedBy") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_MessageId_fkey" FOREIGN KEY ("MessageId") REFERENCES "Message"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_MessageId_fkey" FOREIGN KEY ("MessageId") REFERENCES "Message"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_SharedPostID_fkey" FOREIGN KEY ("SharedPostID") REFERENCES "Post"("PostID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReport" ADD CONSTRAINT "StoryReport_StoryID_fkey" FOREIGN KEY ("StoryID") REFERENCES "Story"("StoryID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReport" ADD CONSTRAINT "StoryReport_ReporterID_fkey" FOREIGN KEY ("ReporterID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostView" ADD CONSTRAINT "PostView_PostID_fkey" FOREIGN KEY ("PostID") REFERENCES "Post"("PostID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostView" ADD CONSTRAINT "PostView_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantConversations" ADD CONSTRAINT "_ParticipantConversations_A_fkey" FOREIGN KEY ("A") REFERENCES "Conversation"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MessageReadBy" ADD CONSTRAINT "_MessageReadBy_A_fkey" FOREIGN KEY ("A") REFERENCES "Message"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
