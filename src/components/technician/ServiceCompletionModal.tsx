import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, X, CheckCircle2, ArrowLeft, ImagePlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SERVICE_TASKS } from "@/types/tech";

interface ServiceCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeownerName: string;
  onSubmit: (data: { beforePhotos: File[]; afterPhotos: File[]; completedTasks: string[]; notes: string }) => void;
}

export default function ServiceCompletionModal({
  open,
  onOpenChange,
  homeownerName,
  onSubmit,
}: ServiceCompletionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setBeforePhotos([]);
      setAfterPhotos([]);
      setSelectedTasks([]);
      setNotes("");
    }, 300);
  };

  const handleFileChange = (files: FileList | null, type: "before" | "after") => {
    if (!files) return;
    const accepted = Array.from(files).filter((f) =>
      f.type === "image/jpeg" || f.type === "image/png"
    );
    if (type === "before") {
      setBeforePhotos((prev) => [...prev, ...accepted]);
    } else {
      setAfterPhotos((prev) => [...prev, ...accepted]);
    }
  };

  const removePhoto = (type: "before" | "after", index: number) => {
    if (type === "before") {
      setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAfterPhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const toggleTask = (task: string) => {
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
  };

  const selectAll = () => {
    if (selectedTasks.length === SERVICE_TASKS.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks([...SERVICE_TASKS]);
    }
  };

  const handleSubmit = () => {
    onSubmit({ beforePhotos, afterPhotos, completedTasks: selectedTasks, notes });
    setStep(5);
  };

  const PhotoUploadArea = ({
    type,
    photos,
    inputRef,
  }: {
    type: "before" | "after";
    photos: File[];
    inputRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files, type)}
      />
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {photos.map((file, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden border border-border h-[80px]">
              <img
                src={URL.createObjectURL(file)}
                alt={`${type} photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(type, i)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 hover:bg-black/80 transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
      >
        <ImagePlus className="h-6 w-6" />
        <span className="text-sm font-medium">
          {photos.length > 0 ? "Add more photos" : "Upload photos (JPG or PNG)"}
        </span>
      </button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto p-0">
        {/* Step 1: Before Photos */}
        {step === 1 && (
          <div className="p-6 pt-10 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Service Report</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Complete the service report for {homeownerName}'s pool.
              </DialogDescription>
            </DialogHeader>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Camera className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Before Photos</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Upload photos of the pool before cleaning.
              </p>
              <PhotoUploadArea type="before" photos={beforePhotos} inputRef={beforeInputRef as React.RefObject<HTMLInputElement>} />
            </div>

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1 font-semibold" disabled={beforePhotos.length === 0} onClick={() => setStep(2)}>
                Next: After Photos
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: After Photos */}
        {step === 2 && (
          <div className="p-6 pt-10 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">After Photos</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Upload photos after the pool service is completed.
              </DialogDescription>
            </DialogHeader>

            <PhotoUploadArea type="after" photos={afterPhotos} inputRef={afterInputRef as React.RefObject<HTMLInputElement>} />

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1 font-semibold" disabled={afterPhotos.length === 0} onClick={() => setStep(3)}>
                Next: Tasks
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Completed Tasks */}
        {step === 3 && (
          <div className="p-6 pt-10 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Completed Tasks</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Select all tasks performed during this service.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <button
                onClick={selectAll}
                className="flex items-center gap-2.5 text-sm font-semibold text-primary hover:underline"
              >
                <Checkbox
                  checked={selectedTasks.length === SERVICE_TASKS.length}
                  className="pointer-events-none"
                />
                Select All
              </button>
              <div className="border-t border-border" />
              {SERVICE_TASKS.map((task) => (
                <label
                  key={task}
                  className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <Checkbox
                    checked={selectedTasks.includes(task)}
                    onCheckedChange={() => toggleTask(task)}
                  />
                  <span className="text-sm text-foreground">{task}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1 font-semibold" disabled={selectedTasks.length === 0} onClick={() => setStep(4)}>
                Next: Notes
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Notes & Submit */}
        {step === 4 && (
          <div className="p-6 pt-10 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Additional Notes</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add any notes about the service or issues found.
              </DialogDescription>
            </DialogHeader>

            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about the service or any issues found."
              className="min-h-[120px]"
            />

            <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</p>
              <p className="text-sm text-foreground">{beforePhotos.length} before photo{beforePhotos.length !== 1 ? "s" : ""}</p>
              <p className="text-sm text-foreground">{afterPhotos.length} after photo{afterPhotos.length !== 1 ? "s" : ""}</p>
              <p className="text-sm text-foreground">{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""} completed</p>
            </div>

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1 font-semibold" onClick={handleSubmit}>
                Submit Service Report
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="p-6 pt-10 space-y-5">
            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 !text-green-600" />
              <AlertDescription className="ml-2">
                <p className="font-semibold text-foreground text-sm">Service Report Submitted</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The service for {homeownerName} has been marked as completed. The homeowner will receive the report.
                </p>
              </AlertDescription>
            </Alert>
            <Button className="w-full font-semibold" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
