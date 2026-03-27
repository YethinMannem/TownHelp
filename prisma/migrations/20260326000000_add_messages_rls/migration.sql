-- Enable RLS on messages table (required for Supabase Realtime security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read messages from conversations they participate in
CREATE POLICY "Users can read messages in their conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      LEFT JOIN provider_profiles pp ON pp.id = c.provider_id
      WHERE c.id = messages.conversation_id
        AND (
          c.requester_id = auth.uid()
          OR pp.user_id = auth.uid()
        )
    )
  );

-- INSERT: users can only send messages as themselves in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      LEFT JOIN provider_profiles pp ON pp.id = c.provider_id
      WHERE c.id = messages.conversation_id
        AND (
          c.requester_id = auth.uid()
          OR pp.user_id = auth.uid()
        )
    )
  );

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only see their own conversations
CREATE POLICY "Users can read their own conversations"
  ON conversations
  FOR SELECT
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM provider_profiles pp
      WHERE pp.id = conversations.provider_id
        AND pp.user_id = auth.uid()
    )
  );

-- Enable Realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
