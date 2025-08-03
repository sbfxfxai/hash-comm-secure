import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ProofOfWorkDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proof of Work Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This component will demonstrate Bitcoin-style proof-of-work for message anti-spam protection.
            Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProofOfWorkDemo;
