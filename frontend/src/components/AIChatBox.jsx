import { useState } from 'react';
import { Loader2, Send, Sparkles, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export function AIChatBox({ messages = [], onSendMessage, isLoading = false, placeholder = 'Type your message...', className }) {
  const [input, setInput] = useState('');
  const displayMessages = messages.filter((message) => message.role !== 'system');

  const submit = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    onSendMessage?.(text);
    setInput('');
  };

  return (
    <div className={cn('flex h-[520px] flex-col rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
      <div className="flex-1 overflow-y-auto p-4">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Sparkles className="h-10 w-10 opacity-30" />
            <p className="text-sm">Start a conversation with AI</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMessages.map((message, index) => (
              <div key={index} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role !== 'user' && <BubbleIcon icon={<Sparkles className="h-4 w-4 text-primary" />} />}
                <div className={cn('max-w-[80%] rounded-lg px-4 py-2.5 text-sm', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && <BubbleIcon icon={<User className="h-4 w-4" />} />}
              </div>
            ))}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        )}
      </div>
      <form onSubmit={submit} className="flex items-end gap-2 border-t bg-background/50 p-4">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) submit(event);
          }}
          placeholder={placeholder}
          className="max-h-32 min-h-9 flex-1 resize-none"
          rows={1}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-[38px] w-[38px] shrink-0">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

function BubbleIcon({ icon }) {
  return <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">{icon}</div>;
}
