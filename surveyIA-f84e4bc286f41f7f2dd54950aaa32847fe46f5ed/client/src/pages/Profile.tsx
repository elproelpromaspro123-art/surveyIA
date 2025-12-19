import { useState, useEffect } from "react";
import { useUser, useUpdateProfile } from "@/hooks/use-users";
import { useAuth } from "@/hooks/useAuth";
import { Navigation, MobileNav } from "@/components/Navigation";
import { Save, User, MapPin, Briefcase, Hash, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clsx } from "clsx";

const DEMO_USER_ID = 1; // Fallback for development

export default function Profile() {
  const { userId } = useAuth();
  const currentUserId = userId || DEMO_USER_ID;

  const { data: user, isLoading } = useUser(currentUserId);
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'demographics' | 'preferences'>('demographics');

  // Simple local state forms - normally would use react-hook-form
  const [formData, setFormData] = useState({
    age: "",
    occupation: "",
    location: "",
    tone: "",
    interests: "",
  });

  // Load initial data when user is fetched
  useEffect(() => {
    if (user && !isLoading) {
      const demo = user.demographics as Record<string, string>;
      const prefs = user.preferences as Record<string, string>;

      setFormData({
        age: demo?.age || "",
        occupation: demo?.occupation || "",
        location: demo?.location || "",
        tone: prefs?.tone || "Professional",
        interests: Array.isArray(prefs?.interests) ? prefs.interests.join(", ") : prefs?.interests || "",
      });
    }
  }, [user, isLoading]);

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        id: currentUserId,
        data: {
          demographics: {
            age: formData.age,
            occupation: formData.occupation,
            location: formData.location,
          },
          preferences: {
            tone: formData.tone,
            interests: formData.interests,
          },
        }
      });
      
      toast({
        title: "Profile Updated",
        description: "Your Digital Twin has been recalibrated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not save profile changes.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navigation />
      <MobileNav />

      <main className="md:ml-64 p-4 md:p-8 lg:p-12 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <header className="mb-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">
              Digital Twin Profile
            </h2>
            <p className="mt-2 text-muted-foreground">
              Define who you are. The AI uses this data to answer surveys authentically.
            </p>
          </header>

          <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
            {/* TABS */}
            <div className="flex border-b border-white/10 bg-black/20">
              <button
                onClick={() => setActiveTab('demographics')}
                className={clsx(
                  "flex-1 py-4 text-sm font-medium transition-colors relative",
                  activeTab === 'demographics' ? "text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                Demographics
                {activeTab === 'demographics' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={clsx(
                  "flex-1 py-4 text-sm font-medium transition-colors relative",
                  activeTab === 'preferences' ? "text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                Preferences & Style
                {activeTab === 'preferences' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                )}
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-8 space-y-6">
              {activeTab === 'demographics' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" /> Age
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleChange('age', e.target.value)}
                      className="glass-input w-full px-4 py-3 rounded-xl border-white/10 focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="e.g. 28"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" /> Occupation
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => handleChange('occupation', e.target.value)}
                      className="glass-input w-full px-4 py-3 rounded-xl border-white/10 focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className="glass-input w-full px-4 py-3 rounded-xl border-white/10 focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="grid gap-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <Type className="w-4 h-4 text-secondary" /> Response Tone
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Casual', 'Professional', 'Academic'].map((t) => (
                        <button
                          key={t}
                          onClick={() => handleChange('tone', t)}
                          className={clsx(
                            "px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                            formData.tone === t 
                              ? "bg-secondary/20 border-secondary text-white shadow-[0_0_15px_rgba(14,165,233,0.2)]" 
                              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <User className="w-4 h-4 text-secondary" /> Key Interests
                    </label>
                    <textarea
                      value={formData.interests}
                      onChange={(e) => handleChange('interests', e.target.value)}
                      className="glass-input w-full px-4 py-3 rounded-xl border-white/10 focus:ring-2 focus:ring-secondary/50 outline-none min-h-[120px]"
                      placeholder="e.g. Technology, Hiking, Sustainable Living, Indie Music..."
                    />
                    <p className="text-xs text-muted-foreground">Comma separated list of topics you care about.</p>
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="
                    px-8 py-3 rounded-xl font-bold text-white
                    bg-white/10 border border-white/10
                    hover:bg-primary hover:border-primary hover:shadow-lg hover:shadow-primary/25
                    transition-all duration-300 flex items-center gap-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  {!updateProfileMutation.isPending && <Save className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
