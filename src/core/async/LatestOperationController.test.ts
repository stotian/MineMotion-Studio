import { describe, expect, it } from "vitest";
import {
  isOperationAborted,
  LatestOperationController,
  OperationAbortedError,
  throwIfOperationAborted
} from "./LatestOperationController";

describe("LatestOperationController", () => {
  it("issues monotonic public IDs and supersedes the previous operation", () => {
    const controller = new LatestOperationController();
    const first = controller.start();
    const second = controller.start();

    expect(second.operationId).toBe(first.operationId + 1);
    expect(first.signal.aborted).toBe(true);
    expect(controller.isCurrent(first.operationId)).toBe(false);
    expect(controller.isCurrent(second.operationId)).toBe(true);
    expect(() => throwIfOperationAborted(first.signal)).toThrow(
      "Operation superseded."
    );
  });

  it("prevents an older completion from clearing the current operation", () => {
    const controller = new LatestOperationController();
    const first = controller.start();
    const second = controller.start();

    expect(controller.finish(first.operationId)).toBe(false);
    expect(controller.isCurrent(second.operationId)).toBe(true);
    expect(controller.finish(second.operationId)).toBe(true);
    expect(controller.isCurrent(second.operationId)).toBe(false);
  });

  it("cancels the active operation with an identifiable abort reason", () => {
    const controller = new LatestOperationController();
    const operation = controller.start();

    expect(controller.cancel()).toBe(operation.operationId);
    expect(operation.signal.aborted).toBe(true);
    expect(controller.isCurrent(operation.operationId)).toBe(false);

    try {
      throwIfOperationAborted(operation.signal);
      throw new Error("Expected cancellation.");
    } catch (error) {
      expect(isOperationAborted(error)).toBe(true);
      expect(error).toBeInstanceOf(OperationAbortedError);
      expect((error as OperationAbortedError).operationId).toBe(
        operation.operationId
      );
    }
  });
});
