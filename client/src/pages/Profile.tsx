import { useState, useEffect } from "react";
import { useUser, useUpdateProfile } from "@/hooks/use-users";
import { useAuth } from "@/hooks/useAuth";
import { Navigation, MobileNav } from "@/components/Navigation";
import { Save, User, MapPin, Briefcase, Hash, Type, Edit2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const DEMO_USER_ID = 1;

export default function Profile() {
  const { userId } = useAuth();
  const currentUserId = userId || DEMO_USER_ID;

  const { data: user, isLoading } = useUser(currentUserId);
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'demographics' | 'preferences'>('demographics');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    age: "",
    occupation: "",
    location: "",
    tone: "",
    interests: "",
  });

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
      setIsSaving(true);
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
        title: "✅ Profile Updated",
        description: "Your Digital Twin has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not save profile changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground font-sans overflow-hidden">
      <Navigation />
      <MobileNav />

      <main className="md:ml-64 p-4 md:p-8 lg:p-12 flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* HEADER */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5">
                <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 mb-1">
                  Digital Twin Profile
                </h1>
                <p className="text-muted-foreground">
                  Tell the AI about yourself for authentic responses
                </p>
              </div>
            </div>
          </motion.header>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl shadow-2xl shadow-primary/10"
          >
            {/* TABS */}
            <div className="flex border-b border-white/10 bg-white/5 p-1">
              {[
                { id: 'demographics', label: 'Demographics', icon: '👤' },
                { id: 'preferences', label: 'Preferences', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-4 text-sm font-semibold transition-all duration-300 relative rounded-lg flex items-center justify-center gap-2 ${
                    activeTab === tab.id 
                      ? "text-white bg-gradient-to-r from-primary to-secondary shadow-lg" 
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CONTENT */}
            <div className="p-8 space-y-6">
              {activeTab === 'demographics' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Age */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-primary" /> Age
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleChange('age', e.target.value)}
                        placeholder="e.g., 28"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-white placeholder:text-white/30 transition-all"
                      />
                    </div>

                    {/* Occupation */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" /> Occupation
                      </label>
                      <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => handleChange('occupation', e.target.value)}
                        placeholder="e.g., Software Engineer"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-white placeholder:text-white/30 transition-all"
                      />
                    </div>

                    {/* Location */}
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" /> Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="e.g., San Francisco, USA"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-white placeholder:text-white/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary/90">
                    <p className="font-semibold mb-1">💡 Why this matters</p>
                    <p>Your demographic information helps the AI understand your context and provide more personalized responses.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Tone */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                      <Type className="w-4 h-4 text-secondary" /> Response Tone
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => handleChange('tone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-secondary/30 hover:bg-white/10 focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 text-white placeholder:text-white/30 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e9d5ff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        paddingRight: '2.5rem',
                      }}
                    >
                      <option value="Professional" className="bg-slate-900 text-white">Professional</option>
                      <option value="Casual" className="bg-slate-900 text-white">Casual</option>
                      <option value="Technical" className="bg-slate-900 text-white">Technical</option>
                      <option value="Creative" className="bg-slate-900 text-white">Creative</option>
                      <option value="Academic" className="bg-slate-900 text-white">Academic</option>
                    </select>
                  </div>

                  {/* Interests */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-secondary" /> Interests & Expertise
                    </label>
                    <textarea
                      value={formData.interests}
                      onChange={(e) => handleChange('interests', e.target.value)}
                      placeholder="e.g., AI, Web Development, Data Science (comma-separated)"
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-secondary/30 hover:bg-white/10 focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 text-white placeholder:text-white/30 transition-all resize-none"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-sm text-secondary/90">
                    <p className="font-semibold mb-1">🎯 Pro Tip</p>
                    <p>Your preferences shape how the AI communicates. Choose a tone that matches how you like to receive information.</p>
                  </div>
                </motion.div>
              )}

              {/* SAVE BUTTON */}
              <div className="pt-8 flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving || updateProfileMutation.isPending}
                  className="flex-1 px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isSaving || updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* STATS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-4"
          >
            {(() => {
              const filled = [formData.age, formData.occupation, formData.location, formData.tone, formData.interests]
                .filter(v => v && String(v).trim() !== "").length;
              const total = 5;
              const completeness = Math.round((filled / total) * 100) + "%";
              // `updatedAt` may not be present in the typed user shape — guard via any
              const updates = user && ((user as any).updatedAt ? 1 : 0);

              return [
                { icon: "📊", label: "Profile Completeness", value: completeness },
                { icon: "🔄", label: "Updates", value: updates ?? 0 },
                { icon: "⏰", label: "Last Updated", value: (user && (user as any).updatedAt) ? new Date((user as any).updatedAt).toLocaleString() : (user?.createdAt ? new Date(user.createdAt).toLocaleString() : "Just now") },
              ].map((stat, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
              >
                <span className="text-2xl block mb-2">{stat.icon}</span>
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </div>
              ));
            })()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
