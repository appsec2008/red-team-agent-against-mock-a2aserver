
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw } from "lucide-react";

interface ProgressDialogProps {
  open: boolean;
}

export function ProgressDialog({ open }: ProgressDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Red Teaming in Progress...
          </AlertDialogTitle>
          <AlertDialogDescription>
            The AI is currently performing its analysis and interacting with the LLM. Please wait a moment. This dialog will close automatically when the test is complete.
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
