import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BitCommButton } from '@/components/ui/bitcomm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { computeProofOfWork, calculateSpamEconomics, type PoWResult, type SpamEconomics } from '@/lib/bitcomm';
import { Clock, Zap, DollarSign, Hash, Cpu, Shield } from 'lucide-react';

export function ProofOfWorkDemo() {
  const [message, setMessage] = useState("Hello, this is my first BitComm message!");
  const [difficulty, setDifficulty] = useState([4]);
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentNonce, setCurrentNonce] = useState(0);
  const [currentHash, setCurrentHash] = useState('');
  const [powResult, setPowResult] = useState<PoWResult | null>(null);
  const [spamEconomics, setSpamEconomics] = useState<SpamEconomics | null>(null);

  const computePoW = useCallback(async () => {
    if (!message.trim()) return;
    
    setIsComputing(true);
    setPowResult(null);
    setProgress(0);
    
    try {
      const result = await computeProofOfWork(
        message,
        difficulty[0],
        (nonce, hash) => {
          setCurrentNonce(nonce);
          setCurrentHash(hash);
          setProgress((nonce % 10000) / 100); // Update progress
        }
      );
      
      setPowResult(result);
      
      // Calculate spam economics
      const economics = calculateSpamEconomics(1000000, difficulty[0]);
      setSpamEconomics(economics);
    } catch (error) {
      console.error('PoW computation failed:', error);
    } finally {
      setIsComputing(false);
      setProgress(0);
    }
  }, [message, difficulty]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
    return `${(seconds / 86400).toFixed(1)}d`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* PoW Configuration */}
      <Card className="border-bitcoin-orange/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-bitcoin-orange" />
            Bitcoin-Style Proof-of-Work Demo
          </CardTitle>
          <CardDescription>
            Experience how BitComm uses Bitcoin's SHA-256 hashing to prevent spam
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message Content</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Difficulty Level: {difficulty[0]} (requires {Math.pow(16, difficulty[0]).toLocaleString()} expected hashes)</Label>
            <Slider
              value={difficulty}
              onValueChange={setDifficulty}
              max={6}
              min={3}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Easy (3)</span>
              <span>Moderate (4-5)</span>
              <span>Hard (6)</span>
            </div>
          </div>

          <BitCommButton 
            onClick={computePoW}
            disabled={isComputing || !message.trim()}
            variant={isComputing ? "mining" : "pow"}
            size="lg"
            className="w-full"
          >
            {isComputing ? (
              <>
                <Cpu className="mr-2 h-4 w-4 animate-spin" />
                Mining... {currentNonce.toLocaleString()} hashes
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Compute Proof-of-Work
              </>
            )}
          </BitCommButton>

          {isComputing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <div className="text-sm text-muted-foreground text-center">
                Current hash: {currentHash.substring(0, 20)}...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PoW Result */}
      {powResult && (
        <Card className="border-green-500/20 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Shield className="h-5 w-5" />
              Proof-of-Work Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{powResult.nonce.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Nonce Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{powResult.computeTime.toFixed(2)}s</div>
                <div className="text-sm text-muted-foreground">Compute Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{powResult.difficulty}</div>
                <div className="text-sm text-muted-foreground">Difficulty</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-bitcoin-orange">✓</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Valid Hash (starts with {'0'.repeat(powResult.difficulty)})</Label>
              <div className="bg-black/5 p-3 rounded font-mono text-sm break-all">
                <span className="text-green-600 font-bold">{'0'.repeat(powResult.difficulty)}</span>
                <span>{powResult.hash.substring(powResult.difficulty)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spam Economics */}
      {spamEconomics && (
        <Card className="border-red-500/20 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <DollarSign className="h-5 w-5" />
              Spam Economics: Why Spammers Can't Win
            </CardTitle>
            <CardDescription>
              Cost analysis for sending 1 million spam messages (typical spam campaign)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-100 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-red-600">
                  {spamEconomics.totalDays.toFixed(0)} days
                </div>
                <div className="text-sm text-red-700">Total Time Required</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTime(spamEconomics.timePerMessage)} per message
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-100 rounded-lg">
                <Zap className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(spamEconomics.electricityCost)}
                </div>
                <div className="text-sm text-red-700">Electricity Cost</div>
                <div className="text-xs text-muted-foreground mt-1">
                  At $0.15/kWh, 50W power
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-100 rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(spamEconomics.totalCost)}
                </div>
                <div className="text-sm text-red-700">Total Cost</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Including hardware rental
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-semibold text-red-700">The Math That Destroys Spam:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Badge variant="destructive" className="mb-2">Spammer Costs</Badge>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• {formatCurrency(spamEconomics.totalCost)} minimum cost</li>
                    <li>• {spamEconomics.totalDays.toFixed(0)} days of computation</li>
                    <li>• Requires specialized hardware farms</li>
                    <li>• No guarantee of delivery or success</li>
                  </ul>
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">Legitimate User</Badge>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• ~$0.003 per message (~free)</li>
                    <li>• {formatTime(spamEconomics.timePerMessage)} wait time</li>
                    <li>• Works on any device</li>
                    <li>• Guaranteed delivery</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-100 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Economic Reality Check:</h4>
              <p className="text-sm text-green-700">
                Even if spammers achieve a 0.1% success rate (1,000 conversions) at $10 profit each, 
                they'd make only <strong>$10,000</strong> while spending <strong>{formatCurrency(spamEconomics.totalCost)}</strong> 
                and waiting <strong>{spamEconomics.totalDays.toFixed(0)} days</strong>. 
                This completely breaks the spam business model!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}