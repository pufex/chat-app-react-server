import type {CorsOptions} from "cors"
import allowedOrigins from "./allowedOrigins"

const corsOptions: CorsOptions = {
    credentials: true,
    origin: (origin, cb) => {
        if(!origin || allowedOrigins.includes(origin))
            cb(null, true)
        else cb(new Error("Not allowed by CORS policy."))
    }
} 

export default corsOptions