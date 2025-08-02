import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  Lock,
  Globe,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BitCommButton } from '@/components/ui/bitcomm-button';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Better Email',
    description: 'Get started with spam-free, secure messaging in under 30 seconds',
    icon: Mail
  },
  {
    id: 'create',
    title: 'Choose Your Address',
    description: 'Pick a username - we\'ll handle the technical stuff',
    icon: Users
  },
  {
    id: 'secure',
    title: 'You\'re Protected',
    description: 'Your account is automatically secured with Bitcoin-level encryption',
    icon: Shield
  },
  {
    id: 'ready',
    title: 'Ready to Message',
    description: 'Start sending and receiving messages instantly',
    icon: CheckCircle
  }
];

const benefits = [
  {
    icon: Shield,
    title: 'No Spam Ever',
    description: 'Advanced protection blocks 100% of unwanted messages'
  },
  {
    icon: Lock,
    title: 'Private by Default',
    description: 'All your messages are automatically encrypted'
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'Send messages to anyone, anywhere in the world'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Messages arrive instantly with read receipts'
  }
];

export const SimpleOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createDIDIdentity } = useAuth();
  const { toast } = useToast();

  const handleCreateAccount = async () => {
    if (!username.trim()) {
      toast({
        title: "Please choose a username",
        description: "Your username will be your BitComm address",
        variant: "destructive"
      });
      return;
    }

    // Validate username (simple rules)
    if (username.length < 3) {
      toast({
        title: "Username too short",
        description: "Please choose a username with at least 3 characters",
        variant: "destructive"
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      toast({
        title: "Invalid characters",
        description: "Username can only contain letters, numbers, hyphens, and underscores",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create DID identity behind the scenes
      await createDIDIdentity(username);
      
      // Move to success step
      setCurrentStep(3);
      
      toast({
        title: "Welcome to BitComm!",
        description: `Your secure address ${username}@bitcomm is ready`,
      });
    } catch (error) {
      toast({
        title: "Username taken",
        description: "Please try a different username",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEmailImport = () => {
    // TODO: Implement email import wizard
    toast({
      title: "Coming Soon",
      description: "Email import will be available in the next update",
    });
  };

  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-bitcoin-orange rounded-full">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Email, But Better</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All the email features you love, with zero spam and military-grade security. 
              No learning curve required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <BitCommButton 
              size="lg" 
              onClick={() => setCurrentStep(1)}
              className="px-8 py-4"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </BitCommButton>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleEmailImport}
              className="px-8 py-4"
            >
              Import From Gmail/Outlook
            </Button>
          </div>

          <div className="text-center mt-8 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                No Credit Card
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Shield className="h-3 w-3 mr-1" />
                Military Security
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Sparkles className="h-3 w-3 mr-1" />
                Zero Spam
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Choose Your Address</CardTitle>
            <p className="text-muted-foreground">
              Pick a username for your secure email address
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="username">Your Username</Label>
              <div className="flex items-center mt-2">
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, ''))}
                  className="rounded-r-none"
                />
                <div className="px-3 py-2 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                  @bitcomm
                </div>
              </div>
              {username && (
                <p className="text-xs text-muted-foreground mt-1">
                  Your address will be: <strong>{username}@bitcomm</strong>
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-600" />
                What happens next?
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• We create your secure, encrypted account instantly</li>
                <li>• You get military-grade protection automatically</li>
                <li>• Start messaging immediately - no verification needed</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(0)}
                className="flex-1"
              >
                Back
              </Button>
              <BitCommButton 
                onClick={handleCreateAccount}
                disabled={!username.trim() || isCreating}
                className="flex-1"
              >
                {isCreating ? 'Creating...' : 'Create Account'}
              </BitCommButton>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-500 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-800">You're All Set!</CardTitle>
            <p className="text-muted-foreground">
              Your secure email account is ready to use
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-3">Your new secure address:</h4>
              <div className="bg-white p-3 rounded border text-center">
                <strong className="text-green-700">{username}@bitcomm</strong>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">What's already working:</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Spam protection is active</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>End-to-end encryption enabled</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Ready to send and receive messages</span>
                </div>
              </div>
            </div>

            <BitCommButton 
              onClick={() => {
                // Navigate to main app
                window.location.reload();
              }}
              className="w-full"
            >
              Start Messaging
              <ArrowRight className="ml-2 h-4 w-4" />
            </BitCommButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default SimpleOnboarding;
