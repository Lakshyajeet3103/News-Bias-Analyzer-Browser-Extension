import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpectrumDial } from '../src/components/SpectrumDial';
describe('SpectrumDial',()=>{it.each([[-1,'Leans left'],[0,'Centre / mixed'],[1,'Leans right']] as const)('renders value %s accessibly', (value,label)=>{render(<SpectrumDial value={value} band={.25} label={label}/>);expect(screen.getByRole('img')).toHaveAttribute('aria-label',expect.stringContaining(label));});});
