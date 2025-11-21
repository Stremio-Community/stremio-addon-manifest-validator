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
  Share2,
  Check,
  Github,
} from "lucide-react";
import { ZodError } from "zod";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import LZString from "lz-string";

function App() {
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    data?: unknown;
    error?: ZodError;
    warning?: ZodError;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = () => {
    const compressed = LZString.compressToEncodedURIComponent(input);
    const newUrl = `${window.location.pathname}?data=${compressed}`;
    window.history.replaceState({}, "", newUrl);
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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

  const handleValidate = async (arg?: string | React.MouseEvent) => {
    setIsLoading(true);
    setValidationResult(null);
    let dataToValidate: unknown;

    try {
      const currentInput = typeof arg === "string" ? arg : input;
      const trimmedInput = currentInput.trim();
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get("data");
    if (data) {
      const decompressed = LZString.decompressFromEncodedURIComponent(data);
      if (decompressed) {
        setInput(decompressed);
        handleValidate(decompressed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="relative flex min-h-screen flex-col bg-slate-50 p-4 font-sans text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-50">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-slate-50">
            Stremio Addon Manifest Validator
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Validate your{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
              manifest.json
            </code>{" "}
            against the official schema.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Input Manifest</CardTitle>
                <CardDescription>
                  Paste your manifest JSON, a URL, or drag & drop your
                  manifest.json file below.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                disabled={!input.trim()}
                title="Share / Copy Link"
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
            </div>
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
                className="min-h-[300px] resize-y border-0 bg-transparent p-4 font-mono text-sm focus-visible:ring-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onBlur={formatJson}
                onPaste={handlePaste}
              />
              <div className="pointer-events-none absolute right-4 bottom-4 opacity-50">
                <UploadCloud className="text-muted-foreground h-8 w-8" />
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
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
            {validationResult.success ? (
              validationResult.warning ? (
                <Alert className="border-yellow-500">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <AlertTitle className="ml-2 text-lg font-semibold">
                    Valid with Warnings
                  </AlertTitle>
                  <AlertDescription className="mt-1 ml-2">
                    <p>
                      The manifest is valid but contains unrecognized fields.
                    </p>
                    <div className="mt-4 space-y-2">
                      {validationResult.warning.issues.map((issue, index) => (
                        <div
                          key={index}
                          className="bg-card text-card-foreground flex flex-col gap-1 rounded-lg border p-3 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-yellow-600 text-[10px] text-yellow-800 uppercase dark:border-yellow-400 dark:text-yellow-300"
                            >
                              {issue.code}
                            </Badge>
                            <span className="font-mono text-sm font-bold">
                              {issue.path.length > 0
                                ? issue.path.join(".")
                                : "root"}
                            </span>
                          </div>
                          <p className="text-muted-foreground ml-1 text-sm">
                            {issue.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertTitle className="ml-2 text-lg font-semibold">
                    Valid Manifest
                  </AlertTitle>
                  <AlertDescription className="mt-1 ml-2">
                    Your manifest follows the correct format and schema.
                  </AlertDescription>
                </Alert>
              )
            ) : (
              <Alert variant="destructive" className="border-red-500">
                <XCircle className="h-5 w-5" />
                <AlertTitle className="ml-2 text-lg font-semibold">
                  Validation Failed
                </AlertTitle>
                <AlertDescription className="mt-1 ml-2">
                  <p>
                    Found {validationResult.error?.issues.length} issue(s) in
                    your manifest.
                  </p>
                  {validationResult.error && (
                    <div className="mt-4 space-y-2">
                      {validationResult.error.issues.map((issue, index) => (
                        <div
                          key={index}
                          className="bg-card text-card-foreground flex flex-col gap-1 rounded-lg border p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="destructive"
                              className="text-[10px] uppercase"
                            >
                              {issue.code}
                            </Badge>
                            <span className="font-mono text-sm font-bold">
                              {issue.path.length > 0
                                ? issue.path.join(".")
                                : "root"}
                            </span>
                          </div>
                          <p className="text-muted-foreground ml-1 text-sm">
                            {issue.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <footer className="text-muted-foreground mt-auto pb-8 text-center text-sm">
          <a
            href="https://github.com/stremio-community/stremio-addon-manifest-validator"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground inline-flex items-center gap-2 transition-colors"
          >
            <Github className="h-4 w-4" />
            Source code
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
