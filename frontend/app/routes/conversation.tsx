import { Database, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { toast } from "~/components/ui/toast";

import { getConnection as getConnectionDetails, initializeConversation } from '../utils/api';
import { useLocation } from 'react-router';

export default function DatabaseChatPage() {
  const location = useLocation();
  const [ connectionId, setConnectionId ] = useState(location.state?.connectionId || '');
  const [ conversationId, setConversationId ] = useState('');
  const [ connectionDetails, setConnectionDetails ] = useState({
    host: '-',
    port: '-',
    database: '-'
  });

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
      if(response.success)
        setConversationId(response.data.conversationId);
    } catch (err) {
      console.log('err ===>', err);
    }
  }
  
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
          {/* AI Message */}
          {/* <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Database className="h-4 w-4" />
            </div>

            <div className="rounded-lg bg-muted px-4 py-3 text-sm">
              Hello! I'm connected to your database. What would you like
              to know?
            </div>
          </div> */}

          {/* User Message */}
          {/* <div className="flex justify-end">
            <div className="max-w-xl rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground">
              Show me the top 5 customers by total order value.
            </div>
          </div> */}

          {/* AI Response */}
          {/* <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Database className="h-4 w-4" />
            </div>

            <div className="max-w-2xl rounded-lg bg-muted px-4 py-3 text-sm">
              Here are the top 5 customers based on their total order value.

              <div className="mt-3 overflow-hidden rounded-md border bg-background">
                <pre className="overflow-x-auto p-4 text-xs">
{`SELECT
  customer_id,
  SUM(total_amount) AS total_value
FROM orders
GROUP BY customer_id
ORDER BY total_value DESC
LIMIT 5;`}
                </pre>
              </div>
            </div>
          </div> */}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Input
              placeholder="Ask anything about your database..."
              className="h-12 pr-12"
            />

            <Button
              size="icon"
              className="absolute right-1.5 top-1.5 h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}