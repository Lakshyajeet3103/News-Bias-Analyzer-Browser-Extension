import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
const client = new QueryClient();
export function AppShell({ children }: { children: ReactNode }) { return <QueryClientProvider client={client}><MotionConfig reducedMotion="user">{children}</MotionConfig></QueryClientProvider>; }
