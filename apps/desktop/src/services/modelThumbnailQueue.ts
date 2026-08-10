type ThumbnailTask<T> = () => Promise<T>;

let queue = Promise.resolve();

export function enqueueThumbnailTask<T>(
    task: ThumbnailTask<T>,
): Promise<T> {
    const nextTask = queue.then(task, task);

    queue = nextTask.then(
        () => undefined,
        () => undefined,
    );

    return nextTask;
}