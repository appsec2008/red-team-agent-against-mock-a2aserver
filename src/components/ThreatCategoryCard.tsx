"use client";

import type { ThreatCategory } from "@/lib/threatCategories";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ThreatCategoryCardProps {
  category: ThreatCategory;
  onRunTest: (categoryId: string) => void;
  status: "idle" | "loading" | "success" | "error";
  isSelected: boolean;
  onSelect: (categoryId: string) => void;
  disabled: boolean;
}

export function ThreatCategoryCard({
  category,
  onRunTest,
  status,
  isSelected,
  onSelect,
  disabled,
}: ThreatCategoryCardProps) {
  const { Icon } = category;

  const getStatusBadgeVariant = () => {
    switch (status) {
      case "success":
        return "default"; // Greenish in some themes, but uses primary here
      case "error":
        return "destructive";
      case "loading":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-lg cursor-pointer",
        isSelected && "ring-2 ring-primary shadow-primary/20",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onSelect(category.id)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <Icon className="w-6 h-6 text-primary" />
          {status !== "idle" && (
            <Badge variant={getStatusBadgeVariant()} className="capitalize text-xs">
              {status}
            </Badge>
          )}
        </div>
        <CardTitle className="font-headline text-md pt-2">{category.name}</CardTitle>
        <CardDescription className="text-xs h-16 overflow-hidden text-ellipsis">
          {category.description}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when button is clicked
            if (!disabled) onRunTest(category.id);
          }}
          disabled={status === "loading" || disabled}
          className="w-full"
          size="sm"
        >
          {status === "loading" ? "Running..." : "Run Test"}
        </Button>
      </CardFooter>
    </Card>
  );
}
