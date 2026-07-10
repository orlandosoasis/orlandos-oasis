import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MessageRow {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  imageUrl: string | null;
  imageType: "before" | "after" | null;
}

function rowToMessage(r: {
  id: string;
  thread_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  image_url?: string | null;
  image_type?: string | null;
}): MessageRow {
  return {
    id: r.id,
    threadId: r.thread_id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    body: r.body,
    readAt: r.read_at,
    createdAt: r.created_at,
    imageUrl: r.image_url ?? null,
    imageType: (r.image_type as "before" | "after" | null) ?? null,
  };
}

/** Build a deterministic thread id for a pair of users. */
export function buildThreadId(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export function useMessages(threadId: string | undefined) {
  return useQuery({
    queryKey: ["messages", threadId],
    enabled: !!threadId,
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToMessage);
    },
  });
}

/** Returns the user's threads with a last-message preview, derived in JS. */
export function useMessageThreads(userId: string | undefined) {
  return useQuery({
    queryKey: ["message-threads", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const seen = new Set<string>();
      const threads: { threadId: string; otherUserId: string; lastMessage: MessageRow }[] = [];
      for (const row of data ?? []) {
        const m = rowToMessage(row);
        if (seen.has(m.threadId)) continue;
        seen.add(m.threadId);
        const otherUserId = m.senderId === userId ? m.recipientId : m.senderId;
        threads.push({ threadId: m.threadId, otherUserId, lastMessage: m });
      }
      return threads;
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      threadId: string;
      senderId: string;
      recipientId: string;
      body: string;
      imageUrl?: string;
      imageType?: "before" | "after";
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          thread_id: input.threadId,
          sender_id: input.senderId,
          recipient_id: input.recipientId,
          body: input.body,
          image_url: input.imageUrl ?? null,
          image_type: input.imageType ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return rowToMessage(data);
    },
    onSuccess: (msg) => {
      qc.invalidateQueries({ queryKey: ["messages", msg.threadId] });
      qc.invalidateQueries({ queryKey: ["message-threads"] });
    },
  });
}
