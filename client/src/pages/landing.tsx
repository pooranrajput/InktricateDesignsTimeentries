import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, BarChart3, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="https://images.squarespace-cdn.com/content/v1/6490bc5d65728852ce40b805/1c310731-bb1d-41a1-99ef-b6a3e3932e3e/inktricatelogo-01.png?format=300w"
                alt="Inktricate Designs"
                className="h-16 md:h-20 object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-black mb-4">
              Inktricate Designs
            </h1>
            <p className="text-xl text-gray-700 mb-2">Time Tracking System</p>
            <p className="text-sm text-gray-600">Professional time management for wedding industry excellence</p>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              size="lg"
              className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-lg font-semibold shadow-lg hover:scale-105 transition-transform"
            >
              <Shield className="w-5 h-5 mr-2" />
              Sign In to Continue
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-black" />
              </div>
              <CardTitle className="text-lg font-semibold text-black">Daily Time Entry</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm leading-relaxed">
                Easily log your daily work hours with our intuitive time tracking interface. 
                Track projects from wedding invitations to wooden fixtures.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-black" />
              </div>
              <CardTitle className="text-lg font-semibold text-black">Team Management</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm leading-relaxed">
                Admin tools for managing your team of 7, setting hourly rates, 
                and overseeing all time entries across the organization.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-black" />
              </div>
              <CardTitle className="text-lg font-semibold text-black">Monthly Reports</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm leading-relaxed">
                Automated monthly payroll calculations and detailed reports. 
                Export data for seamless monthly employee compensation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <div className="mt-20 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-black mb-6">
            Crafted for Wedding Industry Excellence
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Inktricate Designs specializes in creating extraordinary wedding experiences, 
            from elegant invitations to stunning day-of installations. Our time tracking 
            system ensures every hour of creativity and craftsmanship is properly recorded 
            and compensated.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-black mb-1">7</div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black mb-1">100+</div>
              <div className="text-sm text-gray-600">Weddings Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black mb-1">5+</div>
              <div className="text-sm text-gray-600">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black mb-1">∞</div>
              <div className="text-sm text-gray-600">Beautiful Moments</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
