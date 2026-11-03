import { Indicator, Popover, Row, run, Section } from "glimpse-sdk";

const ICON = "alarm-symbolic";
const NAME = "glimpse-stopwatch";

function App() {
    return (
        <>
            <Indicator icon={ICON} tooltip={NAME}>
                {NAME}
            </Indicator>
            <Popover icon={ICON} title={NAME}>
                <Section title={NAME}>
                    <Row title="It works" />
                </Section>
            </Popover>
        </>
    );
}

await run(<App />);
