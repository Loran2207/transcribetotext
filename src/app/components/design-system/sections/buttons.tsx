import { Settings } from "@hugeicons/core-free-icons";
import { Button } from "../../ui/button";
import { Icon } from "../../ui/icon";
import { Section, Block, PropTable } from "../board";
import { AnnoStage, Cell, StageGrid, StageStack, H, W, lead } from "../annotate";

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M16.5 8H9v3h4.3c-.2 1-.7 1.5-1.6 2v2h2.6A7.8 7.8 0 0 0 16.5 8z" />
      <path fill="#34A853" d="M9 17c2.2 0 4-.7 5.3-1.9l-2.6-2A4.8 4.8 0 0 1 4.5 10.5H1.8v2.1A8 8 0 0 0 9 17z" />
      <path fill="#FBBC05" d="M4.5 10.5a4.8 4.8 0 0 1 0-3V5.4H1.8a8 8 0 0 0 0 7.2z" />
      <path fill="#EA4335" d="M9 4.2c1.2 0 2.2.4 3 1.2l2.3-2.3A8 8 0 0 0 1.8 5.4l2.7 2.1A4.8 4.8 0 0 1 9 4.2z" />
    </svg>
  );
}

const SIZE_SPECS = {
  head: ["size", "height", "padding-x", "text", "gap", "radius"],
  rows: [
    ["sm", "32px · h-8", "12px · px-3", "14px / 500", "6px", "full"],
    ["default", "36px · h-9", "16px · px-4", "14px / 500", "8px", "full"],
    ["lg", "40px · h-10", "24px · px-6", "14px / 500", "8px", "full"],
    ["icon", "36×36 · size-9", "-", "-", "-", "full · circle"],
  ],
};

const VARIANT_SPECS = {
  head: ["variant", "surface", "text", "border", "use"],
  rows: [
    ["default", "primary", "primary-foreground", "-", "primary CTA"],
    ["pill-outline", "background", "foreground", "1px border", "secondary"],
    ["pill-dark", "oauth", "oauth-foreground", "-", "OAuth / dark"],
    ["ghost", "transparent", "foreground", "-", "subtle · inline"],
    ["link", "-", "primary", "-", "inline text"],
    ["destructive", "destructive", "white", "-", "delete"],
    ["destructive-outline", "destructive / 10", "destructive", "-", "remove"],
  ],
};

export function ButtonsSection() {
  return (
    <Section
      id="buttons"
      num="01"
      group="Components"
      title="Buttons"
      desc="Every button is a pill (rounded-full) - no exceptions; icon buttons are circular. Filled blue = primary, white-outline = secondary, slate-dark = OAuth."
      spec
    >
      <Block label="Primary">
        <AnnoStage
          annos={[H, W, lead(0.97, 0.12, 44, -30, "radius · full", "r"), lead(0.5, 0.5, 96, 24, "text · 14 / 500", "r")]}
        >
          <Button>Sign in</Button>
        </AnnoStage>
      </Block>

      <Block label="Sizes">
        <StageStack>
          <Cell tag="sm · h-8" variant="row" annos={[H, lead(1, 1, 34, 22, "px-3 · 12", "r")]}>
            <Button size="sm">Small</Button>
          </Cell>
          <Cell tag="default · h-9" variant="row" annos={[H, lead(1, 1, 34, 22, "px-4 · 16", "r")]}>
            <Button>Default</Button>
          </Cell>
          <Cell tag="lg · h-10" variant="row" annos={[H, lead(1, 1, 34, 22, "px-6 · 24", "r")]}>
            <Button size="lg">Large</Button>
          </Cell>
        </StageStack>
      </Block>

      <Block
        label="Variants"
        note={
          <>
            The gray <code>secondary</code> fill and the borderless <code>outline</code> variant exist in the component but are deliberately unused - <code>pill-outline</code> is the standard secondary.
          </>
        }
      >
        <StageGrid>
          <Cell tag="default" variant="mini" annos={[]}><Button>Sign in</Button></Cell>
          <Cell tag="pill-outline" variant="mini" annos={[]}><Button variant="pill-outline">Add folder</Button></Cell>
          <Cell tag="pill-dark · oauth" variant="mini" annos={[]}><Button variant="pill-dark"><GoogleMark />Continue with Google</Button></Cell>
          <Cell tag="ghost" variant="mini" annos={[]}><Button variant="ghost">Ghost</Button></Cell>
          <Cell tag="link" variant="mini" annos={[]}><Button variant="link">Forgot password?</Button></Cell>
          <Cell tag="destructive" variant="mini" annos={[]}><Button variant="destructive">Delete</Button></Cell>
          <Cell tag="destructive-outline" variant="mini" annos={[]}><Button variant="destructive-outline">Remove</Button></Cell>
        </StageGrid>
      </Block>

      <Block label="Icon button">
        <Cell tag="icon · size-9" variant="row" annos={[H, W, lead(0.95, 0.1, 40, -26, "radius · full · circle", "r")]}>
          <Button variant="ghost" size="icon" aria-label="Settings"><Icon icon={Settings} strokeWidth={1.5} /></Button>
        </Cell>
      </Block>

      <Block label="Size & variant tokens">
        <PropTable head={SIZE_SPECS.head} rows={SIZE_SPECS.rows} />
        <PropTable head={VARIANT_SPECS.head} rows={VARIANT_SPECS.rows} />
      </Block>
    </Section>
  );
}
