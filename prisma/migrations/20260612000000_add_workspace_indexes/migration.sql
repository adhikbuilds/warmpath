-- AddIndex: workspace-scoped indexes for high-frequency list queries
-- These prevent full-table scans at 2,000+ rows per workspace.

-- Contact indexes
CREATE INDEX "Contact_workspaceId_idx" ON "Contact"("workspaceId");
CREATE INDEX "Contact_workspaceId_createdAt_idx" ON "Contact"("workspaceId", "createdAt" DESC);
CREATE INDEX "Contact_email_idx" ON "Contact"("email");
CREATE INDEX "Contact_workspaceId_warmthScore_idx" ON "Contact"("workspaceId", "warmthScore" DESC);

-- BizAccount indexes
CREATE INDEX "BizAccount_workspaceId_idx" ON "BizAccount"("workspaceId");
CREATE INDEX "BizAccount_workspaceId_createdAt_idx" ON "BizAccount"("workspaceId", "createdAt" DESC);
CREATE INDEX "BizAccount_workspaceId_name_idx" ON "BizAccount"("workspaceId", "name");

-- Signal indexes
CREATE INDEX "Signal_workspaceId_idx" ON "Signal"("workspaceId");
CREATE INDEX "Signal_workspaceId_urgencyScore_idx" ON "Signal"("workspaceId", "urgencyScore" DESC);
CREATE INDEX "Signal_workspaceId_detectedAt_idx" ON "Signal"("workspaceId", "detectedAt" DESC);

-- Message indexes
CREATE INDEX "Message_workspaceId_idx" ON "Message"("workspaceId");
CREATE INDEX "Message_workspaceId_approvalStatus_idx" ON "Message"("workspaceId", "approvalStatus");

-- WarmPath indexes
CREATE INDEX "WarmPath_workspaceId_idx" ON "WarmPath"("workspaceId");
CREATE INDEX "WarmPath_accountId_idx" ON "WarmPath"("accountId");

-- RelationshipEdge indexes (BFS graph traversal)
CREATE INDEX "RelationshipEdge_workspaceId_idx" ON "RelationshipEdge"("workspaceId");
CREATE INDEX "RelationshipEdge_fromId_idx" ON "RelationshipEdge"("fromId");
CREATE INDEX "RelationshipEdge_toId_idx" ON "RelationshipEdge"("toId");
CREATE INDEX "RelationshipEdge_workspaceId_fromId_toId_idx" ON "RelationshipEdge"("workspaceId", "fromId", "toId");

-- AIUsageLog indexes
CREATE INDEX "AIUsageLog_workspaceId_createdAt_idx" ON "AIUsageLog"("workspaceId", "createdAt" DESC);

-- AuditLog indexes
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt" DESC);

-- Task indexes
CREATE INDEX "Task_workspaceId_idx" ON "Task"("workspaceId");
CREATE INDEX "Task_workspaceId_dueAt_idx" ON "Task"("workspaceId", "dueAt");

-- KnowledgeBaseItem indexes
CREATE INDEX "KnowledgeBaseItem_workspaceId_idx" ON "KnowledgeBaseItem"("workspaceId");
CREATE INDEX "KnowledgeBaseItem_workspaceId_approvedForAi_idx" ON "KnowledgeBaseItem"("workspaceId", "approvedForAi");

-- KnowledgeBaseChunk indexes
CREATE INDEX "KnowledgeBaseChunk_knowledgeBaseItemId_idx" ON "KnowledgeBaseChunk"("knowledgeBaseItemId");
