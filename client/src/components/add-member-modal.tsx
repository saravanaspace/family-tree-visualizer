import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertFamilyMemberSchema, insertRelationshipSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertFamilyMemberSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
}).partial();

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberType: string;
  relatedMemberId: number | null;
}

const getRelationshipConfig = (memberType: string) => {
  // Handle compound types like 'parent-child-biological', 'child-biological'
  // The format is: baseType-subType (e.g., "parent-child-biological")
  const parts = memberType.split('-');
  
  if (parts.length >= 3) {
    // Format: "parent-child-biological" -> baseType="parent-child", subType="biological"
    const baseType = parts.slice(0, -1).join('-'); // "parent-child"
    const subType = parts[parts.length - 1]; // "biological"
    
    switch (baseType) {
      case 'parent-child':
        return {
          type: 'parent-child',
          subType: subType,
          fromIsNew: true, // new member will be the parent
        };
      default:
        return null;
    }
  } else if (parts.length === 2) {
    // Format: "child-biological" -> baseType="child", subType="biological"
    const [baseType, subType] = parts;
    
    switch (baseType) {
      case 'parent':
        return {
          type: 'parent-child',
          subType: subType || 'biological',
          fromIsNew: true, // new member will be the parent
        };
      case 'child':
        return {
          type: 'parent-child',
          subType: subType || 'biological',
          fromIsNew: false, // existing member will be the parent
        };
      default:
        return null;
    }
  } else {
    // Format: "spouse", "guardian", etc.
    const baseType = parts[0];
    
    switch (baseType) {
      case 'spouse':
        return {
          type: 'spouse',
          status: 'active',
          fromIsNew: false, // existing member will be "from"
        };
      case 'guardian':
        return {
          type: 'guardian',
          status: 'active',
          fromIsNew: true, // new member will be the guardian
        };
      case 'other':
        return {
          type: 'other',
          status: 'active',
          fromIsNew: true, // new member will be "from"
        };
      default:
        return null;
    }
  }
};

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
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "unknown",
      birthDate: "",
      birthPlace: "",
      isLiving: true,
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 100,
    },
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "unknown",
        birthDate: "",
        birthPlace: "",
        isLiving: true,
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 100,
      });
    }
  }, [open, form]);

  const createMemberMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/family-members', data);
      const newMember = await response.json();
      
      if (relatedMemberId && newMember?.id) {
        const config = getRelationshipConfig(memberType);
        if (config) {
          const relationshipData = {
            fromMemberId: config.fromIsNew ? newMember.id : relatedMemberId,
            toMemberId: config.fromIsNew ? relatedMemberId : newMember.id,
            type: config.type,
            subType: config.subType,
            status: config.status,
            startDate: new Date().toISOString().split('T')[0]
          };
          
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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Convert empty birthDate string to undefined
    const submitData = {
      ...data,
      birthDate: data.birthDate ? data.birthDate : undefined,
    };
    createMemberMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Family Member</DialogTitle>
          <DialogDescription>
            Add a new family member to your family tree.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter middle name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="male" />
                        </FormControl>
                        <FormLabel className="font-normal">Male</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="female" />
                        </FormControl>
                        <FormLabel className="font-normal">Female</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="other" />
                        </FormControl>
                        <FormLabel className="font-normal">Other</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="unknown" />
                        </FormControl>
                        <FormLabel className="font-normal">Unknown</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Place</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State/Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isLiving"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Living Status</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!form.watch('isLiving') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deathDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Death Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deathPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Death Place</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State/Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
