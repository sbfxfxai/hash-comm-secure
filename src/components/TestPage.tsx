import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const TestPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a test page for development purposes.
            Additional testing components and utilities will be added here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPage;
