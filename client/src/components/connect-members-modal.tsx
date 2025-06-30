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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { FamilyTreeData } from "@shared/schema";

const formSchema = insertRelationshipSchema.extend({
  type: z.enum(["parent-child", "spouse", "adopted", "guardian"]),
  subType: z
    .enum(["biological", "adopted", "step", "foster", "legal"])
    .optional(),
  status: z.enum(["active", "divorced", "separated", "deceased"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

interface ConnectMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyTree?: FamilyTreeData;
}

const relationshipTypes = [
  { value: "parent-child", label: "Parent-Child" },
  { value: "spouse", label: "Spouse" },
  { value: "adopted", label: "Adopted" },
  { value: "guardian", label: "Guardian" },
] as const;

const getSubTypes = (type: string) => {
  switch (type) {
    case "parent-child":
      return [
        { value: "biological", label: "Biological" },
        { value: "adopted", label: "Adopted" },
        { value: "step", label: "Step" },
        { value: "foster", label: "Foster" },
      ];
    case "spouse":
      return [
        { value: "legal", label: "Legal Marriage" },
        { value: "common-law", label: "Common Law" },
      ];
    default:
      return [];
  }
};

const getStatusOptions = (type: string) => {
  switch (type) {
    case "spouse":
      return [
        { value: "active", label: "Active" },
        { value: "divorced", label: "Divorced" },
        { value: "separated", label: "Separated" },
        { value: "deceased", label: "Deceased" },
      ];
    default:
      return [
        { value: "active", label: "Active" },
        { value: "deceased", label: "Deceased" },
      ];
  }
};

export default function ConnectMembersModal({
  open,
  onOpenChange,
  familyTree,
}: ConnectMembersModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromMemberId: 0,
      toMemberId: 0,
      type: "parent-child" as const,
      status: "active" as const,
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        fromMemberId: 0,
        toMemberId: 0,
        type: "parent-child" as const,
        status: "active" as const,
      });
    }
  }, [open, form]);

  const createRelationshipMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/relationships", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-tree"] });
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
    },
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

  const selectedType = form.watch("type");

  if (!familyTree?.members) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Family Members</DialogTitle>
          <DialogDescription>
            Connect family members by selecting their relationship type and status.
          </DialogDescription>
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
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedType === "parent-child"
                      ? "Select the parent"
                      : "Select the first member"}
                  </FormDescription>
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
                      {relationshipTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {getSubTypes(selectedType).length > 0 && (
              <FormField
                control={form.control}
                name="subType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Sub-type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub-type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getSubTypes(selectedType).map((subType) => (
                          <SelectItem key={subType.value} value={subType.value}>
                            {subType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedType === "parent-child"
                      ? "Select the child"
                      : "Select the second member"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getStatusOptions(selectedType).map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("status") === "divorced" && (
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createRelationshipMutation.isPending}
              >
                {createRelationshipMutation.isPending
                  ? "Connecting..."
                  : "Connect Members"}
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