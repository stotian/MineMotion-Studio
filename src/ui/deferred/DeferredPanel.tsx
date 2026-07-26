import {
  Component,
  Suspense,
  lazy,
  type ComponentProps,
  type ComponentType,
  type ReactNode
} from "react";
import { useLocalization } from "../../localization/LocalizationContext";

interface DeferredPanelProps {
  open: boolean;
  onClose: () => void;
}

interface BoundaryProps {
  children: ReactNode;
  closeLabel: string;
  errorLabel: string;
  onClose: () => void;
}

interface BoundaryState {
  failed: boolean;
}

class DeferredPanelErrorBoundary extends Component<
  BoundaryProps,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="modal-backdrop">
          <section className="modal-panel" role="alert">
            <p>{this.props.errorLabel}</p>
            <button
              className="secondary-button"
              type="button"
              onClick={this.props.onClose}
            >
              {this.props.closeLabel}
            </button>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}

export function createDeferredPanel<Panel extends ComponentType<any>>(
  loader: () => Promise<{ default: Panel }>
): Panel {
  const LazyPanel = lazy(loader);
  type Props = ComponentProps<Panel>;

  function DeferredPanel(props: Props) {
    const localization = useLocalization();
    const deferredProps = props as DeferredPanelProps;
    if (!deferredProps.open) return null;

    return (
      <DeferredPanelErrorBoundary
        closeLabel={localization.t("common.close")}
        errorLabel={localization.t("app.panelLoadFailed")}
        onClose={deferredProps.onClose}
      >
        <Suspense
          fallback={
            <div className="modal-backdrop">
              <section
                aria-live="polite"
                aria-busy="true"
                className="modal-panel"
                role="status"
              >
                <p>{localization.t("common.loading")}</p>
              </section>
            </div>
          }
        >
          <LazyPanel {...props} />
        </Suspense>
      </DeferredPanelErrorBoundary>
    );
  }

  return DeferredPanel as Panel;
}
