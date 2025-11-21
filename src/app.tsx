import { useState, useCallback, useEffect } from "react";
import { validate } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  UploadCloud,
  AlertTriangle,
} from "lucide-react";
import { ZodError } from "zod";
import { cn } from "@/lib/utils";

function App() {
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    data?: unknown;
    error?: ZodError;
    warning?: ZodError;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmedInput = input.trim();
    const isUrl =
      trimmedInput.startsWith("http://") || trimmedInput.startsWith("https://");
    const isManifest = trimmedInput.endsWith("manifest.json");

    if (isUrl && isManifest) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(trimmedInput);
          if (response.ok) {
            const data = await response.json();
            setInput(JSON.stringify(data, null, 2));
          }
        } catch {
          // Ignore errors, let the user click validate to see them
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [input]);

  const handleValidate = async () => {
    setIsLoading(true);
    setValidationResult(null);
    let dataToValidate: unknown;

    try {
      const trimmedInput = input.trim();
      if (!trimmedInput) {
        throw new Error("Please enter JSON content or a URL");
      }

      if (
        trimmedInput.startsWith("http://") ||
        trimmedInput.startsWith("https://")
      ) {
        // URL handling
        try {
          const response = await fetch(trimmedInput);
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }
          dataToValidate = await response.json();
        } catch (e) {
          throw new Error("Failed to fetch manifest: " + (e as Error).message);
        }
      } else {
        // JSON handling
        try {
          dataToValidate = JSON.parse(trimmedInput);
          setInput(JSON.stringify(dataToValidate, null, 2));
        } catch (e) {
          throw new Error("Invalid JSON format: " + (e as Error).message);
        }
      }

      const result = validate(dataToValidate);
      setValidationResult(result);
    } catch (err) {
      setValidationResult({
        success: false,
        error: new ZodError([
          {
            code: "custom",
            path: [],
            message: (err as Error).message,
          },
        ]),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        try {
          const parsed = JSON.parse(content);
          setInput(JSON.stringify(parsed, null, 2));
        } catch {
          setInput(content);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    try {
      const parsed = JSON.parse(pastedText);
      if (typeof parsed === "object" && parsed !== null) {
        e.preventDefault();
        setInput(JSON.stringify(parsed, null, 2));
      }
    } catch {
      // Ignore
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
    } catch {
      // Ignore if invalid
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans text-slate-900 dark:text-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Stremio Addon Validator
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Validate your{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
              manifest.json
            </code>{" "}
            against the official schema.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input Manifest</CardTitle>
            <CardDescription>
              Paste your manifest JSON, a URL, or drag & drop your manifest.json
              file below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "relative rounded-md border-2 border-dashed transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Textarea
                placeholder='Paste JSON, URL, or drag file here...
Example URL: https://example.com/manifest.json
Example JSON: { "id": "org.myaddon", "version": "1.0.0", ... }'
                className="min-h-[300px] font-mono text-sm border-0 bg-transparent resize-y focus-visible:ring-0 p-4"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onBlur={formatJson}
                onPaste={handlePaste}
              />
              <div className="absolute bottom-4 right-4 pointer-events-none opacity-50">
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={handleValidate}
              disabled={isLoading || !input.trim()}
              className="w-full md:w-auto"
            >
              {isLoading ? "Validating..." : "Validate Manifest"}
            </Button>
          </CardFooter>
        </Card>

        {validationResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {validationResult.success ? (
              validationResult.warning ? (
                <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-900 dark:text-yellow-100">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <AlertTitle className="text-lg font-semibold ml-2">
                    Valid with Warnings
                  </AlertTitle>
                  <AlertDescription className="ml-2 mt-1">
                    The manifest is valid but contains unrecognized fields.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-lg font-semibold ml-2">
                    Valid Manifest
                  </AlertTitle>
                  <AlertDescription className="ml-2 mt-1">
                    Your manifest follows the correct format and schema.
                  </AlertDescription>
                </Alert>
              )
            ) : (
              <Alert
                variant="destructive"
                className="border-red-500 bg-red-50 dark:bg-red-950/20"
              >
                <XCircle className="h-5 w-5" />
                <AlertTitle className="text-lg font-semibold ml-2">
                  Validation Failed
                </AlertTitle>
                <AlertDescription className="ml-2 mt-1">
                  Found {validationResult.error?.issues.length} issue(s) in your
                  manifest.
                </AlertDescription>
              </Alert>
            )}

            {validationResult.success && validationResult.warning && (
              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardHeader>
                  <CardTitle className="text-yellow-700 dark:text-yellow-400">
                    Warning Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {validationResult.warning.issues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-1 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="uppercase text-[10px] border-yellow-500 text-yellow-700 dark:text-yellow-400"
                          >
                            {issue.code}
                          </Badge>
                          <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                            {issue.path.length > 0
                              ? issue.path.join(".")
                              : "root"}
                          </span>
                        </div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-300 ml-1">
                          {issue.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!validationResult.success && validationResult.error && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-red-700 dark:text-red-400">
                    Error Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {validationResult.error.issues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-1 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="destructive"
                            className="uppercase text-[10px]"
                          >
                            {issue.code}
                          </Badge>
                          <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                            {issue.path.length > 0
                              ? issue.path.join(".")
                              : "root"}
                          </span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-300 ml-1">
                          {issue.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
