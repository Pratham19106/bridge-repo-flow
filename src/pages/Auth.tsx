import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Recycle, Shield, Building, User, Wallet, CheckCircle2, AlertCircle } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<"user" | "official">("user");
  const [userType, setUserType] = useState<"individual" | "company">("individual");
  const [walletAddress, setWalletAddress] = useState("");
  const [isWalletValid, setIsWalletValid] = useState(false);
  const [metaMaskAccounts, setMetaMaskAccounts] = useState<string[]>([]);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(false);

  // Check MetaMask installation on component mount
  useEffect(() => {
    const { ethereum } = window as any;
    setMetaMaskInstalled(!!ethereum?.isMetaMask);
  }, []);

  // Validate Ethereum address format
  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address) && address.length === 42;
  };

  // Connect to MetaMask and fetch accounts
  const handleConnectMetaMask = async () => {
    const { ethereum } = window as any;
    
    if (!ethereum?.isMetaMask) {
      toast.error("MetaMask is not installed. Please install MetaMask extension.");
      return;
    }

    setIsConnectingMetaMask(true);

    try {
      // Request accounts from MetaMask
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setMetaMaskAccounts(accounts as string[]);
        toast.success(`Found ${accounts.length} account(s) in MetaMask`);
      } else {
        toast.error("No accounts found in MetaMask");
      }
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error("You rejected the MetaMask connection request");
      } else {
        toast.error(error.message || "Failed to connect to MetaMask");
      }
    } finally {
      setIsConnectingMetaMask(false);
    }
  };

  // Handle account selection from dropdown
  const handleSelectAccount = (account: string) => {
    setWalletAddress(account);
    setIsWalletValid(isValidEthereumAddress(account));
    toast.success("Wallet address selected!");
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    // Validate wallet for users
    if (loginType === "user" && (!walletAddress || !isWalletValid)) {
      toast.error("Please provide a valid MetaMask wallet address");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user) {
        try {
          // Insert user role with error handling
          const { error: roleError } = await (supabase as any)
            .from("user_roles")
            .insert({
              user_id: data.user.id,
              role: loginType,
            })
            .select();

          if (roleError) {
            const roleErrorMsg = roleError?.message || JSON.stringify(roleError);
            console.error("Error creating role:", roleErrorMsg);
            console.warn("Role creation failed, but continuing with account setup...");
            // Don't fail - continue with wallet setup
          } else {
            console.log("✓ User role created successfully:", loginType);
          }

          // Update wallet address if user
          if (loginType === "user" && walletAddress) {
            try {
              // Add a small delay to ensure profile is created
              await new Promise(resolve => setTimeout(resolve, 500));

              // Use upsert to ensure profile exists and update wallet
              const { error: walletError, data: upsertData } = await supabase
                .from("profiles")
                .upsert({
                  id: data.user.id,
                  wallet_address: walletAddress,
                  is_crypto_verified: true,
                }, {
                  onConflict: "id"
                })
                .select();

              if (walletError) {
                const errorMsg = walletError?.message || JSON.stringify(walletError);
                console.error("Error updating wallet:", errorMsg);
                toast.warning("Account created but wallet setup failed. Please update in profile.");
              } else {
                // Verify wallet was saved by fetching it
                const { data: profile, error: verifyError } = await supabase
                  .from("profiles")
                  .select("wallet_address, is_crypto_verified")
                  .eq("id", data.user.id)
                  .single();

                if (verifyError) {
                  const verifyMsg = verifyError?.message || JSON.stringify(verifyError);
                  console.error("Error verifying wallet:", verifyMsg);
                  toast.warning("Account created but wallet verification failed.");
                } else if (profile?.wallet_address === walletAddress) {
                  console.log("✓ Wallet saved successfully:", walletAddress);
                  toast.success("Account created with wallet verified!");
                } else {
                  console.error("Wallet mismatch - Expected:", walletAddress, "Got:", profile?.wallet_address);
                  toast.warning("Account created but wallet not saved correctly.");
                }
              }
            } catch (walletSetupError: any) {
              const errorMsg = walletSetupError?.message || JSON.stringify(walletSetupError);
              console.error("Wallet setup error:", errorMsg);
              toast.warning("Account created but wallet setup failed.");
            }
          } else {
            toast.success("Account created successfully! Please check your email to verify.");
          }

          navigate("/");
        } catch (setupError: any) {
          console.error("Setup error:", setupError);
          toast.error("Account created but setup incomplete. Please refresh and try again.");
          navigate("/");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error creating account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has any role
      const { data: existingRoles } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      // If user has no role, create one based on selected login type
      if (!existingRoles || existingRoles.length === 0) {
        const { error: insertError } = await (supabase as any)
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: loginType,
          });

        if (insertError) {
          await supabase.auth.signOut();
          toast.error("Error setting up account. Please try again.");
          return;
        }

        toast.success("Account setup complete!");
        navigate("/");
        return;
      }

      // Check if user has the specific role they're trying to log in with
      const hasRequestedRole = (existingRoles as any[])?.some((r: any) => r.role === loginType);

      if (!hasRequestedRole) {
        await supabase.auth.signOut();
        toast.error(`You don't have ${loginType} access. Please select the correct login type.`);
        return;
      }

      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Error signing in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-eco-light via-background to-eco-light/50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Recycle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">E-Waste Management</h1>
          <p className="text-muted-foreground">Sustainable recycling solutions</p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={loginType === "user" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setLoginType("user")}
          >
            <Recycle className="w-4 h-4 mr-2" />
            User Login
          </Button>
          <Button
            variant={loginType === "official" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setLoginType("official")}
          >
            <Shield className="w-4 h-4 mr-2" />
            Official Login
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{loginType === "user" ? "User Portal" : "Official Portal"}</CardTitle>
            <CardDescription>
              {loginType === "user" 
                ? "Buy and sell e-waste items" 
                : "Manage and process e-waste items"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <div className="flex gap-4 mt-2">
                      <Button
                        type="button"
                        variant={userType === "individual" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setUserType("individual")}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Individual
                      </Button>
                      <Button
                        type="button"
                        variant={userType === "company" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setUserType("company")}
                      >
                        <Building className="w-4 h-4 mr-2" />
                        Company
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>

                  {/* MetaMask Connection - Only for Users */}
                  {loginType === "user" && (
                    <div className="border-t pt-4 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">
                          MetaMask Wallet (Sepolia Testnet)
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Connect your MetaMask wallet to register and receive crypto payments
                        </p>
                      </div>

                      {/* Connect MetaMask Button */}
                      {metaMaskInstalled ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleConnectMetaMask}
                          disabled={isConnectingMetaMask || loading}
                          className="w-full"
                        >
                          {isConnectingMetaMask ? "Connecting..." : "🦊 Connect MetaMask"}
                        </Button>
                      ) : (
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800 text-sm">
                            MetaMask not detected. Please install the MetaMask extension.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Account Selection Dropdown */}
                      {metaMaskAccounts.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs">Select Account:</Label>
                          <Select value={walletAddress} onValueChange={handleSelectAccount}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose an account..." />
                            </SelectTrigger>
                            <SelectContent>
                              {metaMaskAccounts.map((account) => (
                                <SelectItem key={account} value={account}>
                                  <span className="font-mono text-sm">
                                    {account.slice(0, 6)}...{account.slice(-4)}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Wallet Address Display */}
                      {walletAddress && (
                        <div className="p-3 bg-muted rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            {isWalletValid ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-xs font-medium">
                              {isWalletValid ? "Valid Wallet Address" : "Invalid Wallet Address"}
                            </span>
                          </div>
                          <p className="font-mono text-xs break-all text-muted-foreground">
                            {walletAddress}
                          </p>
                        </div>
                      )}

                      {/* Help Text */}
                      {!metaMaskInstalled && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                          <p className="text-sm font-medium text-blue-900">Need MetaMask?</p>
                          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Install MetaMask extension (https://metamask.io/)</li>
                            <li>Create or import a wallet</li>
                            <li>Switch to Sepolia Test Network</li>
                            <li>Refresh this page</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || (loginType === "user" && !isWalletValid)}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
