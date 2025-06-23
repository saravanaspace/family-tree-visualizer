import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertRelationshipSchema } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { FamilyTreeData } from "@shared/schema";

const formSchema = insertRelationshipSchema.extend({
  type: z.enum(["parent", "spouse"]),
});

interface ConnectMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyTree?: FamilyTreeData;
}

export default function ConnectMembersModal({
  open,
  onOpenChange,
  familyTree
}: ConnectMembersModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromMemberId: 0,
      toMemberId: 0,
      type: "parent" as const,
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        fromMemberId: 0,
        toMemberId: 0,
        type: "parent" as const,
      });
    }
  }, [open, form]);

  const createRelationshipMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/relationships', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-tree'] });
      toast({
        title: "Success",
        description: "Family members connected successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to connect family members",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (data.fromMemberId === data.toMemberId) {
      toast({
        title: "Error",
        description: "Cannot connect a member to themselves",
        variant: "destructive",
      });
      return;
    }
    createRelationshipMutation.mutate(data);
  };

  if (!familyTree?.members) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Family Members</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fromMemberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Member</FormLabel>
                  <Select 
                    value={field.value.toString()} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select first family member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {familyTree.members.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name} ({member.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="parent">Parent-Child</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toMemberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Member</FormLabel>
                  <Select 
                    value={field.value.toString()} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select second family member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {familyTree.members.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name} ({member.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createRelationshipMutation.isPending}
              >
                {createRelationshipMutation.isPending ? "Connecting..." : "Connect Members"}
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