'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { IndianRupee, LogIn, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginData.email || !loginData.password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('currentUser', loginData.email)
      toast.success('Logged in successfully')
      router.push('/')
      router.refresh()
      setLoading(false)
    }, 500)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (signupData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('currentUser', signupData.email)
      toast.success('Account created and logged in!')
      router.push('/')
      router.refresh()
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-600/30 mb-4">
            <IndianRupee className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Entry Organizer</h1>
          <p className="text-slate-400 text-sm">Track work payments. Stay on top of your finances.</p>
        </div>

        <Card className="bg-slate-800/70 border-slate-700 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg text-center">Welcome</CardTitle>
            <CardDescription className="text-slate-400 text-center">Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="w-full bg-slate-700/60 mb-6">
                <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1 data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-slate-300 text-sm">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-slate-300 text-sm">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-emerald-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 mt-2"
                  >
                    {loading ? <Spinner className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email" className="text-slate-300 text-sm">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-slate-300 text-sm">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-confirm" className="text-slate-300 text-sm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-emerald-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 mt-2"
                  >
                    {loading ? <Spinner className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                  <p className="text-xs text-slate-500 text-center mt-2">
                    You may need to confirm your email before logging in.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
