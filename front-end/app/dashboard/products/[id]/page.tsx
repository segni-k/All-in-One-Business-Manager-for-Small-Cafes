"use client";

import React from "react"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { products as productsApi } from "@/lib/api";
import type { Product } from "@/lib/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-36 shrink-0 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductProfilePage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setError("Invalid product ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    productsApi
      .show(productId)
      .then((res) => {
        setProduct(res.data ?? (res as unknown as Product));
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load product."
        );
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <ProfileSkeleton />;

  if (error || !product) {
    return (
      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/dashboard/products")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Product Not Found
          </p>
          <p className="text-sm text-muted-foreground">
            {error || "The requested product could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  const pStatus = product.deleted_at
    ? "deleted"
    : product.is_active
      ? "active"
      : "inactive";

  const margin = product.price - product.cost;
  const marginPct =
    product.price > 0 ? ((margin / product.price) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-6">
      {/* Back button + Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/products")}
            aria-label="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              {product.sku}
            </p>
          </div>
        </div>
        {pStatus === "deleted" ? (
          <Badge variant="destructive">Deleted</Badge>
        ) : pStatus === "active" ? (
          <Badge className="bg-success text-success-foreground">Active</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Inactive
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-48 w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center rounded-md bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <DetailRow label="Name">{product.name}</DetailRow>
            <DetailRow label="SKU">
              <span className="font-mono">{product.sku}</span>
            </DetailRow>
            <Separator />
            <DetailRow label="Category">
              {typeof product.category === "string"
                ? product.category
                : product.category?.name ?? "\u2014"}
            </DetailRow>
            <DetailRow label="Status">
              {pStatus === "deleted" ? (
                <Badge variant="destructive">Deleted</Badge>
              ) : pStatus === "active" ? (
                <Badge className="bg-success text-success-foreground">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </DetailRow>
            <DetailRow label="Stock">
              <span
                className={
                  product.stock <= (product.low_stock_threshold ?? 10)
                    ? "font-semibold text-destructive"
                    : ""
                }
              >
                {product.stock} units
              </span>
            </DetailRow>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Pricing & Financials
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailRow label="Price">
              <span className="font-mono font-semibold">
                {formatCurrency(product.price)}
              </span>
            </DetailRow>
            <DetailRow label="Cost">
              <span className="font-mono">
                {formatCurrency(product.cost)}
              </span>
            </DetailRow>
            <Separator />
            <DetailRow label="Margin">
              <span
                className={`font-mono font-semibold ${margin >= 0 ? "text-success" : "text-destructive"}`}
              >
                {formatCurrency(margin)} ({marginPct}%)
              </span>
            </DetailRow>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:gap-12">
            <DetailRow label="Created">
              {formatDate(product.created_at)}
            </DetailRow>
            <DetailRow label="Updated">
              {formatDate(product.updated_at)}
            </DetailRow>
            {product.deleted_at && (
              <DetailRow label="Deleted">
                {formatDate(product.deleted_at)}
              </DetailRow>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
