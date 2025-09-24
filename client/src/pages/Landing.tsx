import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, CheckCircle, Share2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import logoUrl from "@assets/RSCILogo_1758526996897.png";
import ThemeToggle from "@/components/ThemeToggle";

export default function Landing() {
  const handleLogin = () => {
    console.log('Redirecting to login...');
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover-elevate cursor-pointer" data-testid="link-landing-logo">
            <img 
              src={logoUrl} 
              alt="Riphah School Logo" 
              className="h-10 w-10 object-contain"
              data-testid="img-landing-logo"
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Social Media Portal</h1>
              <p className="text-sm text-muted-foreground">Riphah School of Computing & Innovation</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={handleLogin} data-testid="button-landing-login">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <Badge className="bg-primary text-primary-foreground">
                Welcome to Our Community
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                Share Your <span className="text-primary">Success Stories</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Connect with the Riphah School community by sharing your achievements, projects, 
                and memorable moments. Every post is carefully reviewed to maintain our high standards.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" onClick={handleLogin} className="min-w-48" data-testid="button-hero-login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Access for administrators and whitelisted contributors
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our streamlined process ensures quality content while making it easy 
                for faculty and students to share their stories.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center hover-elevate">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Submit Content</CardTitle>
                  <CardDescription>
                    Share your achievements, projects, and stories with photos and descriptions
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center hover-elevate">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-chart-2" />
                  </div>
                  <CardTitle>Admin Review</CardTitle>
                  <CardDescription>
                    Our team reviews all submissions to ensure they meet our community standards
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center hover-elevate">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center mb-4">
                    <Share2 className="h-6 w-6 text-chart-1" />
                  </div>
                  <CardTitle>Share & Celebrate</CardTitle>
                  <CardDescription>
                    Approved posts get shareable links to spread your success across social media
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* User Roles Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Choose Your Role
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Your access level depends on your account type. Join as a contributor or administrator 
                to access different features tailored to your needs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contributor Card */}
              <Card className="text-center hover-elevate border-l-4 border-l-chart-1">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-chart-1/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-chart-1" />
                  </div>
                  <CardTitle className="text-chart-1">Contributor Access</CardTitle>
                  <CardDescription>
                    Perfect for students and faculty members who want to share their achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-chart-1 flex-shrink-0" />
                      Submit posts with images and captions
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-chart-1 flex-shrink-0" />
                      Edit and delete your own posts
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-chart-1 flex-shrink-0" />
                      Track approval status
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-chart-1 flex-shrink-0" />
                      Get shareable links for approved content
                    </div>
                  </div>
                  <Button 
                    onClick={handleLogin} 
                    className="w-full bg-chart-1 hover:bg-chart-1/90 text-white"
                    data-testid="button-login-contributor"
                  >
                    Join as Contributor
                  </Button>
                </CardContent>
              </Card>

              {/* Admin Card */}
              <Card className="text-center hover-elevate border-l-4 border-l-destructive">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <CardTitle className="text-destructive">Administrator Access</CardTitle>
                  <CardDescription>
                    Full control for managing content and moderating the community
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      All contributor features included
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      Review and approve/reject posts
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      Manage email whitelist
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      View community statistics
                    </div>
                  </div>
                  <Button 
                    onClick={handleLogin} 
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    data-testid="button-login-admin"
                  >
                    Join as Administrator
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground mb-4">
                Your role is automatically assigned based on your account permissions
              </p>
              <Badge className="bg-primary/10 text-primary">
                Secure authentication powered by Replit
              </Badge>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-chart-1 text-white mb-4">
                  Join Our Community
                </Badge>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Built for Students & Faculty
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Easy account creation for all Riphah community members
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Quality-focused content approval process
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Share2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Professional shareable links for social media
                    </span>
                  </div>
                </div>
                <Button size="lg" onClick={handleLogin} className="mt-8" data-testid="button-community-login">
                  Join Now - It's Free
                </Button>
              </div>
              
              <div className="relative">
                <Card className="p-6 hover-elevate">
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Active Community</p>
                        <p className="text-sm text-muted-foreground">Students, Faculty & Staff</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      "This platform has made it so easy to showcase our department's achievements 
                      and connect with the broader Riphah community."
                    </p>
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium text-foreground">Dr. Sarah Ahmed</p>
                      <p className="text-xs text-muted-foreground">Faculty, Computer Science</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 Riphah School of Computing & Innovation. Empowering innovation through education.
          </p>
        </div>
      </footer>
    </div>
  );
}