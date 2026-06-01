import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function ComponentShowcasePage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Component Showcase</h1>
          <p className="mt-1 text-muted-foreground">A compact reference for common UI primitives.</p>
        </div>
        <Tabs defaultValue="controls">
          <TabsList>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
          </TabsList>
          <TabsContent value="controls" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Controls</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Primary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="max-w-sm space-y-1.5">
                  <Label htmlFor="showcase-input">Input</Label>
                  <Input id="showcase-input" placeholder="Example field" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cards" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {['Dashboard metric', 'List item'].map((title) => (
                <Card key={title}>
                  <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">Reusable card surface with current theme tokens.</CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
