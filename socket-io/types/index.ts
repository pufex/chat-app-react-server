import type { Socket, Server } from "socket.io";
import type { DefaultEventsMap as DEM } from "socket.io/dist/typed-events";
import type { ExtendedError } from "socket.io/dist/namespace";

export type SocketType = Socket<DEM,DEM,DEM,any>
export type ServerType = Server<DEM,DEM,DEM,any>

export type EventController = (
    io: ServerType,
    socket: SocketType
) => any

export type ServerMiddleware = (
    socket: SocketType,
    next: (err?: ExtendedError) => void
) => any
