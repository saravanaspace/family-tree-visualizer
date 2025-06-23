import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertFamilyMemberSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertFamilyMemberSchema.extend({
  name: z.string().min(1, "Name is required"),
});

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberType: string;
  relatedMemberId: number | null;
}

export default function AddMemberModal({
  open,
  onOpenChange,
  memberType,
  relatedMemberId
}: AddMemberModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      birthDate: "",
      location: "",
      type: memberType,
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 100,
    },
  });

  // Reset form when modal opens with new member type
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        birthDate: "",
        location: "",
        type: memberType,
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 100,
      });
    }
  }, [open, memberType, form]);

  const createMemberMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      console.log('Creating member:', data);
      console.log('Related member ID:', relatedMemberId);
      
      const newMember = await apiRequest('POST', '/api/family-members', data);
      console.log('New member created:', newMember);
      
      // Create relationship if there's a related member
      if (relatedMemberId && newMember.id) {
        const relationshipType = getRelationshipType(memberType);
        console.log('Relationship type:', relationshipType);
        
        if (relationshipType) {
          const relationshipData = {
            fromMemberId: relationshipType.from === 'new' ? newMember.id : relatedMemberId,
            toMemberId: relationshipType.to === 'new' ? newMember.id : relatedMemberId,
            type: relationshipType.type
          };
          console.log('Creating relationship:', relationshipData);
          
          await apiRequest('POST', '/api/relationships', relationshipData);
        }
      }
      
      return newMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] });
      toast({
        title: "Success",
        description: "Family member added successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add family member",
        variant: "destructive",
      });
    }
  });

  const getRelationshipType = (type: string) => {
    switch (type) {
      case 'child':
        return { type: 'parent', from: 'related', to: 'new' };
      case 'father':
      case 'mother':
        return { type: 'parent', from: 'new', to: 'related' };
      case 'spouse':
        return { type: 'spouse', from: 'related', to: 'new' };
      default:
        return null;
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMemberMutation.mutate({
      ...data,
      type: memberType,
    });
  };

  const memberTypeLabels: Record<string, string> = {
    father: "Father",
    mother: "Mother", 
    spouse: "Spouse",
    child: "Child"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {memberTypeLabels[memberType] || "Family Member"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birth Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="City, State/Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createMemberMutation.isPending}
              >
                {createMemberMutation.isPending ? "Adding..." : "Add Member"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
