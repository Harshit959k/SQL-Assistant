import { Database, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { toast } from "~/components/ui/toast";

import { converse, getConnection as getConnectionDetails, initializeConversation } from '../utils/api';
import { useLocation } from 'react-router';
import type { ConversationRecord } from "~/utils/interface";

export default function DatabaseChatPage() {
  const location = useLocation();
  const [ connectionId, setConnectionId ] = useState(location.state?.connectionId || '');
  const [ conversationId, setConversationId ] = useState('');
  const [ connectionDetails, setConnectionDetails ] = useState({
    host: '-',
    port: '-',
    database: '-'
  });
  const [ conversation, setConversation ] = useState<ConversationRecord[]>([]);
  const [ input, setInput ] = useState('');

  useEffect(() => {
    getConnection();
    initConversation();
  }, []);

  const getConnection = async () => {
    try {
      if(!connectionId) {
        toast.add({
          title: 'No valid connection found',
          type: 'error'
        });
        return;
      }

      const response = await getConnectionDetails(connectionId);
      if(response.success) {
        setConnectionDetails({
          host: response.data.host,
          port: response.data.port,
          database: response.data.database
        });
      }
    } catch (err) {
      console.log('err ===>', err);
    }
  }

  const initConversation = async () => {
    try {
      if(!connectionId)
        return;

      const response = await initializeConversation(connectionId);
      if(response.success) {
        setConversationId(response.data.conversationId);
        setConversation([
          {
            content:
              "Hello! I'm connected to your database. What would you like to know?",
            role: "assistant",
          },
        ])
      }
    } catch (err) {
      console.log('err ===>', err);
    }
  }

  const handleUserMessage = async () => {
    if (!input.trim()) return;

    const userQuery = input;
    setInput('');

    setConversation(prev => [
      ...prev,
      {
        role: 'user',
        content: userQuery,
      },
    ]);

    try {
      const body = { query: userQuery };
      const response = converse(connectionId, conversationId, body);
      let assistantStarted = false;

      for await (const chunk of response) {
        setConversation(prev => {
          if (!assistantStarted) {
            assistantStarted = true;

            return [
              ...prev,
              {
                role: 'assistant',
                content: chunk,
              },
            ];
          }

          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];

          if (lastMessage?.role === 'assistant') {
            updated[updated.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + chunk,
            };
          }

          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-primary" />

          <div>
            <h1 className="font-semibold">Database Chat</h1>
            <p className="text-xs text-muted-foreground">
              Ask questions about your database
            </p>
          </div>
        </div>

        {/* Connection Info */}
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Database: </span>
            <span className="font-medium">{ connectionDetails.database }</span>
          </div>

          <Separator orientation="vertical" className="h-5" />

          <div>
            <span className="text-muted-foreground">Host: </span>
            <span className="font-medium">{ connectionDetails.host }</span>
          </div>

          <Separator orientation="vertical" className="h-5" />

          <div>
            <span className="text-muted-foreground">Port: </span>
            <span className="font-medium">{ connectionDetails.port }</span>
          </div>
        </div>
      </header>

      {/* Chat */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
          {
            conversation.map(record => {
              return <>
                { record.role === 'assistant' ? <AIMessage content={record.content} /> : <UserMessage content={record.content} /> }
              </>
            })
          }
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Input
              placeholder="Ask anything about your database..."
              className="h-12 pr-12"
              value={input}
              onChange={e => setInput(e.target.value) }
            />

            <Button
              size="icon"
              className="absolute right-1.5 top-1.5 h-9 w-9"
              onClick={handleUserMessage}
              disabled={!input}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIMessage({ content }: { content: string }) {
  return <>
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Database className="h-4 w-4" />
      </div>

      <div className="rounded-lg bg-muted px-4 py-3 text-sm">
        { content }
      </div>
    </div>
  </>
}

function UserMessage({ content }: { content: string }) {
  return <>
    <div className="flex justify-end">
      <div className="max-w-xl rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground">
        { content }
      </div>
    </div>
  </>
}
