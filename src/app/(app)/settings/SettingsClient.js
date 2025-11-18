/*
 * File: src/app/(app)/settings/SettingsClient.js
 * SR-DEV: This is the "best-in-class" Client Component
 * for the "Settings" page. It manages all the tab
 * state and forms.
 */

"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ProfileImage from "@/components/ProfileImage";

// SR-DEV: Import all our new server actions
import {
  updateExpertProfile,
  updateExpertServices,
  updateExpertAvailability,
  updateExpertDocuments,
} from "@/actions/expert-settings";

// --- Icons ---
const UserIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const BriefcaseIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);
const ClockIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const FileTextIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
);
const Loader2Icon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
const TrashIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 6l1-4h12l1 4" /></svg>
);
// ---

const TABS = [
  { id: "profile", name: "Profile", icon: <UserIcon /> },
  { id: "services", name: "Services", icon: <BriefcaseIcon /> },
  { id: "availability", name: "Availability", icon: <ClockIcon /> },
  { id: "documents", name: "Documents", icon: <FileTextIcon /> },
];

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * @description The main client component for the Settings page.
 * Manages tab state and renders the correct form.
 */
export default function SettingsClient({ expert }) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Tab Navigation */}
      <nav className="md:col-span-1">
        <ul className="space-y-2">
          {TABS.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {tab.icon}
                <span className="font-medium">{tab.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Form Content */}
      <div className="md:col-span-3">
        {activeTab === "profile" && <ProfileForm expert={expert} />}
        {activeTab === "services" && <ServicesForm expert={expert} />}
        {activeTab === "availability" && <AvailabilityForm expert={expert} />}
        {activeTab === "documents" && <DocumentsForm expert={expert} />}
      </div>
    </div>
  );
}

// ---
// SR-DEV: "Best-in-class" pattern. We define the forms as
// sub-components within the same file to keep logic
// co-located and avoid prop drilling.
// ---

/**
 * @description Form for editing the main profile.
 */
function ProfileForm({ expert }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const formRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSuccess(false);
    const formData = new FormData(event.target);
    
    startTransition(async () => {
      const result = await updateExpertProfile(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
      // SR-DEV: In a real app, we'd add error handling
    });
  };

  return (
    <FormWrapper
      title="Public Profile"
      description="This information will be visible to users."
      onSubmit={handleSubmit}
      isPending={isPending}
      success={success}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Label>Profile Picture</Label>
          <ProfileImage
            src={expert.profilePicture}
            name={expert.name}
            sizeClass="h-32 w-32 mt-2"
            textClass="text-4xl"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="profilePicture">Profile Picture URL</Label>
          <Input
            id="profilePicture"
            name="profilePicture"
            defaultValue={expert.profilePicture}
            placeholder="https://your-image-url.com/profile.png"
          />
          <p className="text-xs text-zinc-500 mt-1">
            SR-DEV: This is a placeholder. A "best-in-class" v2 would be a file upload.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormItem>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" defaultValue={expert.name} required />
        </FormItem>
        <FormItem>
          <Label htmlFor="specialization">Specialization</Label>
          <Input id="specialization" name="specialization" defaultValue={expert.specialization} placeholder="e.g., Cognitive Therapist" />
        </FormItem>
      </div>
      
      <FormItem>
        <Label htmlFor="bio">About Me (Bio)</Label>
        <Textarea id="bio" name="bio" defaultValue={expert.bio} rows={5} placeholder="Tell users about your experience, approach, and what they can expect." />
      </FormItem>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormItem>
          <Label htmlFor="experienceYears">Years of Experience</Label>
          <Input id="experienceYears" name="experienceYears" type="number" defaultValue={expert.experienceYears} min="0" />
        </FormItem>
        <FormItem>
          <Label htmlFor="education">Education</Label>
          <Input id="education" name="education" defaultValue={expert.education} placeholder="e.g., M.A. in Psychology" />
        </FormItem>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormItem>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={expert.location} placeholder="e.g., Saharsa, Bihar" />
        </FormItem>
        <FormItem>
          <Label htmlFor="gender">Gender</Label>
          {/* SR-DEV: THE FIX - Default to "none" if value is "" or null */}
          <Select name="gender" defaultValue={expert.gender || "none"}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select a gender" />
            </SelectTrigger>
            <SelectContent>
              {/* SR-DEV: THE FIX - Use "none" as the value, not "" */}
              <SelectItem value="none">Prefer not to say</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Non-Binary">Non-Binary</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormItem>
          <Label htmlFor="languages">Languages</Label>
          <Input id="languages" name="languages" defaultValue={expert.languages?.join(', ')} placeholder="e.g., English, Hindi, Maithili" />
          <p className="text-xs text-zinc-500 mt-1">Comma-separated values.</p>
        </FormItem>
        <FormItem>
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" defaultValue={expert.tags?.join(', ')} placeholder="e.g., Anxiety, Stress, Relationships" />
          <p className="text-xs text-zinc-500 mt-1">Comma-separated values.</p>
        </FormItem>
      </div>
    </FormWrapper>
  );
}

/**
 * @description Form for editing Services.
 */
function ServicesForm({ expert }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [services, setServices] = useState(expert.services || []);

  const handleFieldChange = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = (field === 'duration' || field === 'videoPrice' || field === 'clinicPrice')
      ? (value === "" ? null : Number(value)) // Convert to number or null
      : value;
    setServices(newServices);
  };

  const addService = () => {
    setServices([...services, { name: "", duration: 45, videoPrice: null, clinicPrice: null }]);
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setSuccess(false);
    startTransition(async () => {
      const result = await updateExpertServices(services);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
      // SR-DEV: Add error handling
    });
  };

  return (
    <FormWrapper
      title="My Services"
      description="Define the services you offer and their prices."
      onSave={handleSubmit} // Use a different prop since it's not a <form>
      isPending={isPending}
      success={success}
    >
      <div className="space-y-6">
        {services.map((service, index) => (
          <div key={index} className="rounded-lg border p-4 space-y-4 relative dark:border-zinc-700">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              onClick={() => removeService(index)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
            <FormItem>
              <Label>Service Name</Label>
              <Input value={service.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} placeholder="e.g., Initial Consultation" />
            </FormItem>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormItem>
                <Label>Duration (min)</Label>
                <Input type="number" value={service.duration || ""} onChange={(e) => handleFieldChange(index, 'duration', e.target.value)} />
              </FormItem>
              <FormItem>
                <Label>Video Price (₹)</Label>
                <Input type="number" value={service.videoPrice || ""} onChange={(e) => handleFieldChange(index, 'videoPrice', e.target.value)} placeholder="e.g., 1500" />
              </FormItem>
              <FormItem>
                <Label>In-Clinic Price (₹)</Label>
                <Input type="number" value={service.clinicPrice || ""} onChange={(e) => handleFieldChange(index, 'clinicPrice', e.target.value)} placeholder="e.g., 2000" />
              </FormItem>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={addService} className="mt-6">
        + Add Service
      </Button>
    </FormWrapper>
  );
}

/**
 * @description Form for editing Availability.
 */
function AvailabilityForm({ expert }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [availability, setAvailability] = useState(expert.availability || []);

  const handleFieldChange = (index, field, value) => {
    const newAvailability = [...availability];
    newAvailability[index][field] = value;
    setAvailability(newAvailability);
  };

  const addSlot = () => {
    setAvailability([...availability, { dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00" }]);
  };

  const removeSlot = (index) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setSuccess(false);
    startTransition(async () => {
      const result = await updateExpertAvailability(availability);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
      // SR-DEV: Add error handling
    });
  };

  return (
    <FormWrapper
      title="My Availability"
      description="Set your weekly schedule. Users will only be able to book you during these times."
      onSave={handleSubmit}
      isPending={isPending}
      success={success}
    >
      <div className="space-y-6">
        {availability.map((slot, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end rounded-lg border p-4 relative dark:border-zinc-700">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              onClick={() => removeSlot(index)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
            <FormItem className="sm:col-span-2">
              <Label>Day of Week</Label>
              <Select value={slot.dayOfWeek} onValueChange={(v) => handleFieldChange(index, 'dayOfWeek', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
            <FormItem>
              <Label>Start Time</Label>
              <Input type="time" value={slot.startTime} onChange={(e) => handleFieldChange(index, 'startTime', e.target.value)} />
            </FormItem>
            <FormItem>
              <Label>End Time</Label>
              <Input type="time" value={slot.endTime} onChange={(e) => handleFieldChange(index, 'endTime', e.target.value)} />
            </FormItem>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={addSlot} className="mt-6">
        + Add Time Slot
      </Button>
    </FormWrapper>
  );
}

/**
 * @description Form for editing Documents.
 */
function DocumentsForm({ expert }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [documents, setDocuments] = useState(expert.documents || []);

  const handleFieldChange = (index, field, value) => {
    const newDocuments = [...documents];
    newDocuments[index][field] = value;
    setDocuments(newDocuments);
  };

  const addDocument = () => {
    setDocuments([...documents, { title: "", type: "pdf", url: "" }]);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setSuccess(false);
    startTransition(async () => {
      const result = await updateExpertDocuments(documents);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
      // SR-DEV: Add error handling
    });
  };

  return (
    <FormWrapper
      title="My Documents"
      description="Upload licenses and certifications for verification. This is not public."
      onSave={handleSubmit}
      isPending={isPending}
      success={success}
    >
      <div className="space-y-6">
        {documents.map((doc, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end rounded-lg border p-4 relative dark:border-zinc-700">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              onClick={() => removeDocument(index)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
            <FormItem>
              <Label>Document Title</Label>
              <Input value={doc.title} onChange={(e) => handleFieldChange(index, 'title', e.target.value)} placeholder="e.g., M.A. Degree" />
            </FormItem>
            <FormItem>
              <Label>Type</Label>
              <Select value={doc.type} onValueChange={(v) => handleFieldChange(index, 'type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            <FormItem>
              <Label>Document URL</Label>
              <Input value={doc.url} onChange={(e) => handleFieldChange(index, 'url', e.target.value)} placeholder="https://..." />
            </FormItem>
          </div>
        ))}
        <p className="text-xs text-zinc-500 mt-1">
          SR-DEV: This is a placeholder. A "best-in-class" v2 would be a secure file upload (e.g., Vercel Blob or S3).
        </p>
      </div>
      <Button variant="outline" onClick={addDocument} className="mt-6">
        + Add Document
      </Button>
    </FormWrapper>
  );
}

/**
 * @description A wrapper for form sections with a header and footer.
 * It handles either a <form> submit or a button onClick save.
 */
const FormWrapper = ({ title, description, isPending, success, onSubmit, onSave, children }) => {
  const content = (
    <>
      {/* Header */}
      <div className="pb-6 border-b dark:border-zinc-700">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="text-sm text-zinc-500 mt-1">{description}</p>
      </div>
      
      {/* Form Fields */}
      <div className="py-8 space-y-6">
        {children}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-end gap-4 p-6 border-t dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
        {success && (
          <p className="text-sm font-medium text-green-600">
            Saved successfully!
          </p>
        )}
        <Button 
          type={onSubmit ? "submit" : "button"} 
          onClick={onSave} 
          disabled={isPending} 
          className="gap-2"
        >
          {isPending ? <Loader2Icon className="h-5 w-5 animate-spin" /> : null}
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </>
  );

  if (onSubmit) {
    return (
      <form 
        onSubmit={onSubmit} 
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden"
      >
        {content}
      </form>
    );
  }

  return (
    <div 
      className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden"
    >
      {content}
    </div>
  );
};

// Helper for form items
const FormItem = ({ children }) => (
  <div className="grid w-full items-center gap-1.5">{children}</div>
);