import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Package, AlertTriangle } from "lucide-react";
import backend from "~backend/client";
import type { CreateCategoryRequest } from "~backend/inventory/create_category";
import type { CreateProductRequest } from "~backend/inventory/create_product";

export default function InventoryPage() {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [categoryData, setCategoryData] = useState<CreateCategoryRequest>({
    name: "",
    description: "",
  });
  const [productData, setProductData] = useState<CreateProductRequest>({
    sku: "",
    name: "",
    description: "",
    categoryId: undefined,
    unitPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    maxStockLevel: undefined,
    unit: "pcs",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => backend.inventory.listCategories(),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => backend.inventory.listProducts(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryRequest) => backend.inventory.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowCategoryForm(false);
      setCategoryData({ name: "", description: "" });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductRequest) => backend.inventory.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowProductForm(false);
      setProductData({
        sku: "",
        name: "",
        description: "",
        categoryId: undefined,
        unitPrice: 0,
        costPrice: 0,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: undefined,
        unit: "pcs",
      });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate(categoryData);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate(productData);
  };

  const lowStockProducts = products?.products.filter(p => p.stockQuantity <= p.minStockLevel) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Manage your products and categories</p>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="font-medium">{product.name}</span>
                  <Badge variant="destructive">
                    {product.stockQuantity} / {product.minStockLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Products</h2>
            <Button onClick={() => setShowProductForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          {showProductForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={productData.sku}
                        onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="productName">Product Name *</Label>
                      <Input
                        id="productName"
                        value={productData.name}
                        onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={productData.categoryId?.toString() || ""}
                        onValueChange={(value) => setProductData({ ...productData, categoryId: value ? parseInt(value) : undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={productData.unit}
                        onChange={(e) => setProductData({ ...productData, unit: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unitPrice">Unit Price</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        value={productData.unitPrice}
                        onChange={(e) => setProductData({ ...productData, unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="costPrice">Cost Price</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        value={productData.costPrice}
                        onChange={(e) => setProductData({ ...productData, costPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stockQuantity">Initial Stock</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        value={productData.stockQuantity}
                        onChange={(e) => setProductData({ ...productData, stockQuantity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minStockLevel">Min Stock Level</Label>
                      <Input
                        id="minStockLevel"
                        type="number"
                        value={productData.minStockLevel}
                        onChange={(e) => setProductData({ ...productData, minStockLevel: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="productDescription">Description</Label>
                    <Textarea
                      id="productDescription"
                      value={productData.description}
                      onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createProductMutation.isPending}>
                      {createProductMutation.isPending ? "Creating..." : "Create Product"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowProductForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{product.name}</span>
                    <Package className="h-5 w-5 text-gray-400" />
                  </CardTitle>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Stock:</span>
                    <Badge variant={product.stockQuantity <= product.minStockLevel ? "destructive" : "default"}>
                      {product.stockQuantity} {product.unit}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Unit Price:</span>
                    <span className="text-sm font-medium">${product.unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cost Price:</span>
                    <span className="text-sm font-medium">${product.costPrice.toFixed(2)}</span>
                  </div>
                  {product.categoryName && (
                    <div className="flex justify-between">
                      <span className="text-sm">Category:</span>
                      <span className="text-sm">{product.categoryName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Categories</h2>
            <Button onClick={() => setShowCategoryForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>

          {showCategoryForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Category</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name *</Label>
                    <Input
                      id="categoryName"
                      value={categoryData.name}
                      onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryData.description}
                      onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createCategoryMutation.isPending}>
                      {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCategoryForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories?.categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {category.description && (
                    <p className="text-sm text-gray-600">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Created: {new Date(category.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
