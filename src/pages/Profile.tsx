import { useState, useRef } from "react";
import { 
  User, 
  Phone, 
  Globe, 
  Save, 
  Loader2, 
  Upload, 
  Camera, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useAvatar, buildSpriteStyle } from "@/hooks/useAvatar";
import { NavBar } from "@/components/NavBar";
import { Seo } from "@/components/Seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AvatarPickerModal } from "@/components/AvatarPickerModal";

export default function Profile() {
  const { data, loading, saving, error, save } = useProfile();
  const { selection, setSelection } = useAvatar();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("male");
  const [language, setLanguage] = useState("en");
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with loaded profile data
  useState(() => {
    if (data) {
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhone(data.phone);
      setGender(data.gender);
      setLanguage(data.language);
    }
  });

  // Re-sync if data updates (e.g. from loading state finish)
  const [lastDataId, setLastDataId] = useState("");
  const currentDataId = `${data.firstName}-${data.lastName}-${data.phone}-${data.gender}-${data.language}`;
  if (currentDataId !== lastDataId && !loading) {
    setFirstName(data.firstName);
    setLastName(data.lastName);
    setPhone(data.phone);
    setGender(data.gender);
    setLanguage(data.language);
    setLastDataId(currentDataId);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save profile fields
    const res = await save({
      firstName,
      lastName,
      phone,
      gender,
      language,
      avatarUrl: avatarPreview || data.avatarUrl,
      avatarFile: avatarFile || undefined
    });

    if (res.ok) {
      toast.success("Profile saved successfully!");
      setAvatarFile(null);
      // If we uploaded a custom avatar file, set the selection to custom type with the new URL
      if (avatarPreview) {
        setSelection({ type: "custom", url: avatarPreview });
      }
    } else {
      toast.error(res.error || "Failed to save profile.");
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Seo title="Profile Settings — Subbly" description="Manage your account profile details and settings." path="/profile" />
      
      <NavBar activeView="Profile" />

      <main className="mx-auto max-w-4xl px-6 py-12 md:px-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">Manage your personal profile details, preferences, and avatar options.</p>
        </div>

        {loading ? (
          <div className="flex h-[350px] items-center justify-center rounded-2xl border border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="text-center space-y-2">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#ff5c3a]" />
              <p className="text-xs text-zinc-400">Loading your profile settings...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Left Column: Avatar Settings */}
            <div className="md:col-span-1 space-y-6">
              <Card className="border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-[16px] font-bold">Profile Avatar</CardTitle>
                  <CardDescription className="text-xs">Customize your workspace avatar</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center pb-6">
                  {/* Avatar Display */}
                  <div className="relative group mb-5">
                    <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center shadow-md">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                      ) : selection?.type === "sprite" ? (
                        <div
                          style={buildSpriteStyle(selection.col, selection.row, selection.sprite, 112)}
                        />
                      ) : selection?.type === "custom" ? (
                        <img src={selection.url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : data.avatarUrl ? (
                        <img src={data.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-3xl font-bold text-zinc-300 dark:text-zinc-600 font-serif">
                          {firstName.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="absolute bottom-0 right-0 p-2.5 rounded-full bg-[#ff5c3a] text-white hover:bg-[#ff7558] shadow-lg transition-all group-hover:scale-105 active:scale-95"
                      aria-label="Change Avatar"
                    >
                      <Camera className="h-4.5 w-4.5" strokeWidth={2.2} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPickerOpen(true)}
                      className="w-full text-xs font-semibold h-9.5 border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-[#ff5c3a] hover:border-[#ff5c3a]/30"
                    >
                      Select Avatar Options
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Profile Form Details */}
            <div className="md:col-span-2 space-y-6">
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-4 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              <Card className="border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
                  <CardDescription className="text-xs">Update your first and last name along with contacts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">First Name</label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="h-10 dark:bg-zinc-950 dark:border-zinc-800"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Last Name</label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="h-10 dark:bg-zinc-950 dark:border-zinc-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="h-10 dark:bg-zinc-950 dark:border-zinc-800"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e8e4de] dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Preferences</CardTitle>
                  <CardDescription className="text-xs">Select your application language and options.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        Gender
                      </label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="h-10 dark:bg-zinc-950 dark:border-zinc-800">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-zinc-950 dark:border-zinc-800">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other / Rather not say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Language
                      </label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="h-10 dark:bg-zinc-950 dark:border-zinc-800">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-zinc-950 dark:border-zinc-800">
                          <SelectItem value="en">English (US)</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="ja">日本語</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#ff5c3a] hover:bg-[#ff7558] text-white flex items-center gap-1.5 font-bold h-11 px-6 shadow-md shadow-[#ff5c3a]/10 transition-all active:scale-[0.98]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Profile Details
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>

      <AvatarPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
